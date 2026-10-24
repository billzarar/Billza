"""
Function-based views for Stellar payment preparation, verification, and payment records.
"""

import csv
from datetime import datetime
from decimal import Decimal
from django.utils import timezone
from django.http import HttpResponse
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from core.models import AuditLog
from bills.models import BillOccurrence, OccurrenceStatus
from bills.services import advance_recurring_bill
from stellar.client import stellar_service
from .models import PaymentRecord, PaymentMethod, VerificationStatus
from .serializers import (
    PaymentRecordSerializer,
    PaymentPrepareRequestSerializer,
    PaymentPrepareResponseSerializer,
    PaymentVerifyRequestSerializer,
    FundWalletRequestSerializer,
    StellarBalanceSerializer,
)

@extend_schema(
    tags=['Payments'],
    summary='Prepare a Stellar payment transaction',
    description=(
        'Initiates payment preparation for an unpaid bill occurrence. '
        'Validates recipient Stellar address and generates unique payment reference for transaction memo or Soroban call.'
    ),
    request=PaymentPrepareRequestSerializer,
    responses={
        200: PaymentPrepareResponseSerializer,
        400: OpenApiResponse(description='Invalid occurrence or recipient not configured'),
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_prepare(request):
    serializer = PaymentPrepareRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    occurrence_id = serializer.validated_data['occurrence_id']
    raw_payer = serializer.validated_data.get('payer_address')
    if not raw_payer and hasattr(request.user, 'profile'):
        raw_payer = request.user.profile.wallet_address
    payer_address = raw_payer or ''

    occ = get_object_or_404(BillOccurrence.objects.select_related('bill'), pk=occurrence_id, bill__user=request.user)

    if occ.status == OccurrenceStatus.PAID:
        return Response({'error': 'This bill occurrence has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)
    if occ.status == OccurrenceStatus.CANCELLED:
        return Response({'error': 'This bill occurrence is cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

    recipient_address = occ.bill.recipient_stellar_address
    if not recipient_address:
        # Fallback to configured testnet fee/platform demonstration recipient
        recipient_address = settings.BILLZA_PLATFORM_FEE_RECIPIENT or 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q'

    # Create or update pending PaymentRecord
    with transaction.atomic():
        payment_record, _ = PaymentRecord.objects.get_or_create(
            occurrence=occ,
            verification_status=VerificationStatus.AWAITING_SIGNATURE,
            defaults={
                'user': request.user,
                'bill': occ.bill,
                'amount': occ.amount,
                'asset': occ.currency if occ.currency in ('XLM', 'USDC') else 'USDC',
                'payment_method': PaymentMethod.STELLAR_TESTNET,
                'recipient_address': recipient_address,
                'payer_address': payer_address,
                'payment_reference': occ.payment_reference,
            }
        )
        payment_record.payer_address = payer_address
        payment_record.save(update_fields=['payer_address'])

    data = {
        'payment_id': payment_record.id,
        'occurrence_id': occ.id,
        'bill_name': occ.bill.name,
        'amount': occ.amount,
        'asset': payment_record.asset,
        'recipient_address': recipient_address,
        'payer_address': payer_address,
        'payment_reference': occ.payment_reference,
        'estimated_network_fee': '0.0000100 XLM',
        'contract_id': settings.BILLZA_CONTRACT_ID,
        'network_passphrase': settings.STELLAR_NETWORK_PASSPHRASE,
    }
    return Response(data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Payments'],
    summary='Verify and submit confirmed Stellar payment',
    description=(
        'Verifies a submitted Stellar Testnet transaction hash against Horizon and Soroban RPC. '
        'Checks transaction status, recipient, asset, amount, payment reference, and double-spend prevention. '
        'On success, confirms payment, marks occurrence as paid, and advances recurring schedule.'
    ),
    request=PaymentVerifyRequestSerializer,
    responses={
        200: PaymentRecordSerializer,
        400: OpenApiResponse(description='Verification failure or duplicate transaction'),
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_submit_verify(request):
    serializer = PaymentVerifyRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    occurrence_id = serializer.validated_data['occurrence_id']
    tx_hash = serializer.validated_data['transaction_hash'].strip()
    raw_payer = serializer.validated_data.get('payer_address')
    if not raw_payer and hasattr(request.user, 'profile'):
        raw_payer = request.user.profile.wallet_address
    payer_address = raw_payer or ''

    occ = get_object_or_404(BillOccurrence.objects.select_related('bill'), pk=occurrence_id, bill__user=request.user)

    if occ.status == OccurrenceStatus.PAID:
        return Response({'error': 'This occurrence is already marked as paid.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Double-crediting check: ensure this tx_hash has NOT already been credited to any payment
    already_used = PaymentRecord.objects.filter(
        transaction_hash=tx_hash,
        verification_status=VerificationStatus.CONFIRMED,
    ).exclude(occurrence=occ).exists()

    if already_used:
        return Response(
            {'error': 'This transaction hash has already been credited to another bill payment. Replay rejected.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    payment_record = PaymentRecord.objects.filter(occurrence=occ).first()
    if not payment_record:
        recipient_addr = occ.bill.recipient_stellar_address or settings.BILLZA_PLATFORM_FEE_RECIPIENT
        payment_record = PaymentRecord.objects.create(
            user=request.user,
            bill=occ.bill,
            occurrence=occ,
            amount=occ.amount,
            asset=occ.currency if occ.currency in ('XLM', 'USDC') else 'USDC',
            recipient_address=recipient_addr,
            payer_address=payer_address,
            payment_reference=occ.payment_reference,
            verification_status=VerificationStatus.VERIFICATION_PENDING,
            transaction_hash=tx_hash,
        )
    else:
        payment_record.transaction_hash = tx_hash
        payment_record.verification_status = VerificationStatus.VERIFICATION_PENDING
        payment_record.save(update_fields=['transaction_hash', 'verification_status'])

    # 2. Invoke Stellar Verification Engine
    expected_asset = payment_record.asset
    expected_amount = payment_record.amount
    expected_recipient = payment_record.recipient_address

    verified, message, details = stellar_service.verify_payment_transaction(
        tx_hash=tx_hash,
        expected_recipient=expected_recipient,
        expected_amount=expected_amount,
        expected_asset=expected_asset,
        expected_reference=occ.payment_reference,
    )

    with transaction.atomic():
        if not verified:
            payment_record.verification_status = VerificationStatus.FAILED
            payment_record.error_message = message
            payment_record.save(update_fields=['verification_status', 'error_message'])

            AuditLog.objects.create(
                user=request.user,
                action='PAYMENT_VERIFY_FAILED',
                details={'occurrence_id': occ.id, 'tx_hash': tx_hash, 'error': message},
                ip_address=request.META.get('REMOTE_ADDR'),
            )
            return Response(
                {
                    'error': f'Stellar payment verification failed: {message}',
                    'payment': PaymentRecordSerializer(payment_record).data,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Success: confirm payment record and update occurrence
        now = timezone.now()
        payment_record.verification_status = VerificationStatus.CONFIRMED
        payment_record.error_message = ''
        payment_record.ledger_sequence = details.get('ledger')
        payment_record.ledger_timestamp = now
        payment_record.save()

        occ.status = OccurrenceStatus.PAID
        occ.is_manual_paid = False
        occ.paid_at = now
        occ.transaction_hash = tx_hash
        occ.save()

        # 4. Advance recurring bill schedule to generate the next cycle
        next_occ = advance_recurring_bill(occ.bill, occ)

        AuditLog.objects.create(
            user=request.user,
            action='PAYMENT_CONFIRMED',
            details={
                'occurrence_id': occ.id,
                'bill_name': occ.bill.name,
                'amount': str(payment_record.amount),
                'asset': payment_record.asset,
                'tx_hash': tx_hash,
                'next_occurrence_id': next_occ.id if next_occ else None,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
        )

    return Response(PaymentRecordSerializer(payment_record).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Payments'],
    summary='List user payment history',
    description='Returns payment attempts and confirmed records with filtering by status, date range, and asset.',
    parameters=[
        OpenApiParameter(name='status', type=str, description='Filter by status: CONFIRMED, FAILED, AWAITING_SIGNATURE'),
        OpenApiParameter(name='asset', type=str, description='Filter by asset: XLM, USDC'),
        OpenApiParameter(name='start_date', type=str, description='Filter created_at >= YYYY-MM-DD'),
        OpenApiParameter(name='end_date', type=str, description='Filter created_at <= YYYY-MM-DD'),
    ],
    responses={200: PaymentRecordSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history_list(request):
    queryset = PaymentRecord.objects.filter(user=request.user).select_related('bill', 'occurrence')

    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(verification_status__iexact=status_filter)

    asset = request.query_params.get('asset')
    if asset:
        queryset = queryset.filter(asset__iexact=asset)

    start_date = request.query_params.get('start_date')
    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)

    end_date = request.query_params.get('end_date')
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)

    serializer = PaymentRecordSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Payments'],
    summary='Export payment records as CSV',
    description='Downloads user payment history in standard CSV format.',
    responses={200: OpenApiResponse(description='CSV file download')}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history_export_csv(request):
    payments = PaymentRecord.objects.filter(user=request.user).select_related('bill', 'occurrence')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="billza_payment_history_{datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Payment ID',
        'Bill Name',
        'Category',
        'Occurrence #',
        'Amount',
        'Asset',
        'Payment Method',
        'Recipient Address',
        'Payer Address',
        'Transaction Hash',
        'Payment Reference',
        'Status',
        'Timestamp',
    ])

    for p in payments:
        writer.writerow([
            p.id,
            p.bill.name,
            p.bill.category,
            p.occurrence.occurrence_number if p.occurrence else '',
            p.amount,
            p.asset,
            p.payment_method,
            p.recipient_address,
            p.payer_address,
            p.transaction_hash,
            p.payment_reference,
            p.verification_status,
            p.created_at.strftime('%Y-%m-%d %H:%M:%S UTC'),
        ])

    return response

@extend_schema(
    tags=['Payments'],
    summary='Retrieve Stellar Testnet wallet balances',
    description='Queries Stellar Horizon for native XLM and USDC balances of a given Stellar account address.',
    parameters=[
        OpenApiParameter(name='address', type=str, required=True, description='Stellar public key (starts with G)'),
    ],
    responses={200: StellarBalanceSerializer, 400: OpenApiResponse(description='Invalid address')}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def stellar_wallet_balances(request):
    address = request.query_params.get('address')
    if not address:
        return Response({'error': "Query parameter 'address' is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = stellar_service.get_account_balances(address)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['Payments'],
    summary='Fund Stellar Testnet account with Friendbot',
    description='Funds a Stellar Testnet public address with 10,000 testnet XLM using Friendbot faucet.',
    request=FundWalletRequestSerializer,
    responses={200: OpenApiResponse(description='Account funded successfully')}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def fund_wallet_faucet(request):
    address = request.data.get('address') or request.query_params.get('address')
    if not address:
        return Response({'error': "'address' parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

    result = stellar_service.fund_testnet_account(address)
    return Response(result, status=status.HTTP_200_OK)
