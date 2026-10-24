from datetime import date
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from bills.models import Bill, BillOccurrence, OccurrenceStatus, BillCategory
from payments.models import PaymentRecord, VerificationStatus, PaymentMethod

class PaymentsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='payuser', email='payuser@example.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.bill = Bill.objects.create(
            user=self.user,
            name='Electricity',
            category=BillCategory.ELECTRICITY,
            amount=Decimal('75.5000000'),
            currency='USDC',
            recipient_stellar_address='GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            due_date=date(2026, 11, 25),
        )
        self.occ = BillOccurrence.objects.create(
            bill=self.bill,
            occurrence_number=1,
            due_date=date(2026, 11, 25),
            amount=Decimal('75.5000000'),
            currency='USDC',
            status=OccurrenceStatus.UPCOMING,
        )

    def test_payment_prepare(self):
        resp = self.client.post('/api/payments/prepare/', {'occurrence_id': self.occ.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['occurrence_id'], self.occ.id)
        self.assertEqual(Decimal(str(resp.data['amount'])), Decimal('75.5000000'))
        self.assertEqual(resp.data['asset'], 'USDC')
        self.assertEqual(resp.data['recipient_address'], self.bill.recipient_stellar_address)
        self.assertTrue(resp.data['payment_reference'].startswith('BILLZA-'))

    @patch('stellar.client.stellar_service.verify_payment_transaction')
    def test_payment_verify_success_and_double_credit_prevention(self, mock_verify):
        # 1. Mock successful verification from Horizon
        mock_verify.return_value = (True, "Payment verified successfully on Stellar Testnet.", {
            'ledger': 1234567,
            'created_at': '2026-10-24T12:00:00Z',
        })

        tx_hash = "61c945f69041ca19dcd0962f7c08ef50975686a93dcb108f03787aa5343b626d"

        # Submit payment
        resp = self.client.post('/api/payments/verify/', {
            'occurrence_id': self.occ.id,
            'transaction_hash': tx_hash,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['verification_status'], VerificationStatus.CONFIRMED)
        self.assertEqual(resp.data['transaction_hash'], tx_hash)

        # Assert occurrence is marked as paid
        self.occ.refresh_from_db()
        self.assertEqual(self.occ.status, OccurrenceStatus.PAID)
        self.assertFalse(self.occ.is_manual_paid)

        # 2. Replay attack / double-crediting test: try crediting the SAME tx_hash to another occurrence
        occ2 = BillOccurrence.objects.get(bill=self.bill, occurrence_number=2)
        replay_resp = self.client.post('/api/payments/verify/', {
            'occurrence_id': occ2.id,
            'transaction_hash': tx_hash,
        }, format='json')
        self.assertEqual(replay_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been credited', replay_resp.data['error'])

    def test_payment_history_and_csv_export(self):
        PaymentRecord.objects.create(
            user=self.user,
            bill=self.bill,
            occurrence=self.occ,
            amount=Decimal('75.5000000'),
            asset='USDC',
            recipient_address=self.bill.recipient_stellar_address,
            transaction_hash='abcdef123456',
            payment_reference=self.occ.payment_reference,
            verification_status=VerificationStatus.CONFIRMED,
        )

        # List history
        resp = self.client.get('/api/payments/history/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

        # CSV export
        csv_resp = self.client.get('/api/payments/history/export-csv/')
        self.assertEqual(csv_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(csv_resp['Content-Type'], 'text/csv')
        self.assertIn('Payment ID,Bill Name', csv_resp.content.decode('utf-8'))
