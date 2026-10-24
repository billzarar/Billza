"""
Function-based views for Bill and BillOccurrence management.
"""

from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from core.models import AuditLog
from .models import Bill, BillOccurrence, OccurrenceStatus, BillCategory, BillFrequency
from .serializers import (
    BillSerializer,
    BillCreateUpdateSerializer,
    BillOccurrenceSerializer,
    OccurrenceMarkManualPaidSerializer,
    OccurrenceSnoozeSerializer,
)
from .services import create_initial_occurrence, advance_recurring_bill

@extend_schema(
    tags=['Bills'],
    summary='List or create user bills',
    description='Returns all bills owned by the authenticated user with search, filtering, and pagination, or creates a new bill.',
    parameters=[
        OpenApiParameter(name='search', type=str, description='Search bill by name or description'),
        OpenApiParameter(name='category', type=str, description='Filter by category (e.g. ELECTRICITY, INTERNET, RENT, SUBSCRIPTIONS)'),
        OpenApiParameter(name='frequency', type=str, description='Filter by frequency (ONE_OFF, WEEKLY, MONTHLY, QUARTERLY, YEARLY)'),
        OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
        OpenApiParameter(name='ordering', type=str, description='Order by field: due_date, -due_date, amount, -amount, name'),
    ],
    request=BillCreateUpdateSerializer,
    responses={
        200: BillSerializer(many=True),
        201: BillSerializer,
        400: OpenApiResponse(description='Validation error'),
    }
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bill_list_create(request):
    if request.method == 'GET':
        queryset = Bill.objects.filter(user=request.user).prefetch_related('occurrences')

        # Search filter
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)

        # Category filter
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        # Frequency filter
        frequency = request.query_params.get('frequency')
        if frequency:
            queryset = queryset.filter(frequency__iexact=frequency)

        # Active filter
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('true', '1'))

        # Ordering
        ordering = request.query_params.get('ordering', 'due_date')
        if ordering in ['due_date', '-due_date', 'amount', '-amount', 'name', '-name', 'created_at', '-created_at']:
            queryset = queryset.order_by(ordering)

        # Dynamic status refresh on occurrences
        for bill in queryset:
            for occ in bill.occurrences.all():
                occ.update_dynamic_status()

        serializer = BillSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # POST create bill
    serializer = BillCreateUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        bill = serializer.save(user=request.user)
        # Create initial occurrence #1
        create_initial_occurrence(bill)

        AuditLog.objects.create(
            user=request.user,
            action='BILL_CREATED',
            details={
                'bill_id': bill.id,
                'name': bill.name,
                'amount': str(bill.amount),
                'currency': bill.currency,
                'frequency': bill.frequency,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
        )

    return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)

@extend_schema(
    tags=['Bills'],
    summary='Retrieve, update, or delete a bill',
    description='Manages a specific bill record and its associated occurrence history.',
    request=BillCreateUpdateSerializer,
    responses={
        200: BillSerializer,
        204: OpenApiResponse(description='Bill deleted or archived successfully'),
        404: OpenApiResponse(description='Bill not found'),
    }
)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def bill_detail(request, pk):
    bill = get_object_or_404(Bill.objects.prefetch_related('occurrences'), pk=pk, user=request.user)

    if request.method == 'GET':
        for occ in bill.occurrences.all():
            occ.update_dynamic_status()
        return Response(BillSerializer(bill).data, status=status.HTTP_200_OK)

    if request.method in ('PUT', 'PATCH'):
        serializer = BillCreateUpdateSerializer(bill, data=request.data, partial=(request.method == 'PATCH'))
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            serializer.save()
            # If active upcoming occurrence exists, update amount and due_date
            active_occ = bill.occurrences.filter(status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON]).first()
            if active_occ:
                active_occ.amount = bill.amount
                active_occ.currency = bill.currency
                active_occ.due_date = bill.due_date
                active_occ.save()

            AuditLog.objects.create(
                user=request.user,
                action='BILL_UPDATED',
                details={'bill_id': bill.id, 'name': bill.name},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        return Response(BillSerializer(bill).data, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        bill_id = bill.id
        bill_name = bill.name
        bill.delete()

        AuditLog.objects.create(
            user=request.user,
            action='BILL_DELETED',
            details={'bill_id': bill_id, 'name': bill_name},
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

@extend_schema(
    tags=['Occurrences'],
    summary='List scheduled bill occurrences',
    description='Returns individual scheduled payment cycles across bills with status, category, date filters, and search.',
    parameters=[
        OpenApiParameter(name='status', type=str, description='Filter by status: UPCOMING, DUE_SOON, OVERDUE, PAID, CANCELLED'),
        OpenApiParameter(name='category', type=str, description='Filter by category'),
        OpenApiParameter(name='start_due', type=str, description='Filter due_date >= YYYY-MM-DD'),
        OpenApiParameter(name='end_due', type=str, description='Filter due_date <= YYYY-MM-DD'),
        OpenApiParameter(name='search', type=str, description='Search parent bill name'),
        OpenApiParameter(name='ordering', type=str, description='Order by: due_date, -due_date, amount, -amount'),
    ],
    responses={200: BillOccurrenceSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def occurrence_list(request):
    queryset = BillOccurrence.objects.filter(bill__user=request.user).select_related('bill')

    # Update statuses
    for occ in queryset:
        occ.update_dynamic_status()

    # Status filter
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status__iexact=status_filter)

    # Category filter
    category = request.query_params.get('category')
    if category:
        queryset = queryset.filter(bill__category__iexact=category)

    # Date filters
    start_due = request.query_params.get('start_due')
    if start_due:
        queryset = queryset.filter(due_date__gte=start_due)

    end_due = request.query_params.get('end_due')
    if end_due:
        queryset = queryset.filter(due_date__lte=end_due)

    # Search
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(bill__name__icontains=search)

    # Ordering
    ordering = request.query_params.get('ordering', 'due_date')
    if ordering in ['due_date', '-due_date', 'amount', '-amount', 'status', '-status']:
        queryset = queryset.order_by(ordering)

    serializer = BillOccurrenceSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Occurrences'],
    summary='Retrieve occurrence details',
    description='Gets full details of an individual bill occurrence including payment reference and parent bill info.',
    responses={200: BillOccurrenceSerializer, 404: OpenApiResponse(description='Occurrence not found')}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def occurrence_detail(request, pk):
    occ = get_object_or_404(BillOccurrence.objects.select_related('bill'), pk=pk, bill__user=request.user)
    occ.update_dynamic_status()
    return Response(BillOccurrenceSerializer(occ).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Occurrences'],
    summary='Mark bill occurrence as manually paid',
    description=(
        'Marks a scheduled bill occurrence as manually paid without requiring a Stellar blockchain transaction. '
        'Automatically advances recurring schedule to generate the next cycle while preserving separate records.'
    ),
    request=OccurrenceMarkManualPaidSerializer,
    responses={
        200: BillOccurrenceSerializer,
        400: OpenApiResponse(description='Occurrence already paid or cancelled'),
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def occurrence_mark_manual_paid(request, pk):
    occ = get_object_or_404(BillOccurrence.objects.select_related('bill'), pk=pk, bill__user=request.user)
    if occ.status == OccurrenceStatus.PAID:
        return Response({'error': 'This bill occurrence is already marked as paid.'}, status=status.HTTP_400_BAD_REQUEST)
    if occ.status == OccurrenceStatus.CANCELLED:
        return Response({'error': 'Cannot pay a cancelled occurrence.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = OccurrenceMarkManualPaidSerializer(data=request.data)
    serializer.is_valid()
    notes = serializer.validated_data.get('notes', '')

    with transaction.atomic():
        occ.status = OccurrenceStatus.PAID
        occ.is_manual_paid = True
        occ.paid_at = timezone.now()
        if notes:
            occ.notes = f"{occ.notes}\nManual Payment Note: {notes}".strip()
        occ.save()

        # Advance recurring bill
        next_occ = advance_recurring_bill(occ.bill, occ)

        AuditLog.objects.create(
            user=request.user,
            action='OCCURRENCE_MANUAL_PAID',
            details={
                'occurrence_id': occ.id,
                'bill_name': occ.bill.name,
                'amount': str(occ.amount),
                'next_occurrence_id': next_occ.id if next_occ else None,
            },
            ip_address=request.META.get('REMOTE_ADDR'),
        )

    return Response(BillOccurrenceSerializer(occ).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Occurrences'],
    summary='Snooze occurrence due date',
    description='Snoozes the due date of an upcoming or overdue occurrence by the specified number of days.',
    request=OccurrenceSnoozeSerializer,
    responses={200: BillOccurrenceSerializer, 400: OpenApiResponse(description='Cannot snooze paid occurrence')}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def occurrence_snooze(request, pk):
    occ = get_object_or_404(BillOccurrence.objects.select_related('bill'), pk=pk, bill__user=request.user)
    if occ.status == OccurrenceStatus.PAID:
        return Response({'error': 'Cannot snooze an already paid occurrence.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = OccurrenceSnoozeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    days = serializer.validated_data.get('days', 3)
    occ.due_date = occ.due_date + timedelta(days=days)
    occ.update_dynamic_status()
    occ.save()

    AuditLog.objects.create(
        user=request.user,
        action='OCCURRENCE_SNOOZED',
        details={'occurrence_id': occ.id, 'snooze_days': days, 'new_due_date': str(occ.due_date)},
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    return Response(BillOccurrenceSerializer(occ).data, status=status.HTTP_200_OK)
