from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from bills.models import Bill, BillOccurrence, BillCategory, BillFrequency, OccurrenceStatus
from bills.services import add_months, calculate_next_due_date, advance_recurring_bill

class BillsAndRecurrenceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', email='tester@example.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_calendar_date_math_edge_cases(self):
        # Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year)
        jan_31 = date(2026, 1, 31)
        feb_due = add_months(jan_31, 1)
        self.assertEqual(feb_due, date(2026, 2, 28))

        # Aug 31 + 1 month -> Sep 30
        aug_31 = date(2026, 8, 31)
        sep_due = add_months(aug_31, 1)
        self.assertEqual(sep_due, date(2026, 9, 30))

        # Leap year Feb 29 + 1 year -> Feb 28
        leap_feb = date(2024, 2, 29)
        next_year = calculate_next_due_date(leap_feb, BillFrequency.YEARLY)
        self.assertEqual(next_year, date(2025, 2, 28))

    def test_bill_creation_and_initial_occurrence(self):
        payload = {
            'name': 'Fiber Internet',
            'category': BillCategory.INTERNET,
            'description': 'High-speed fiber connection',
            'amount': '49.9900000',
            'currency': 'USDC',
            'recipient_name': 'Metro Fiber Co',
            'frequency': BillFrequency.MONTHLY,
            'start_date': '2026-11-01',
            'due_date': '2026-11-15',
        }
        resp = self.client.post('/api/bills/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Fiber Internet')
        self.assertEqual(len(resp.data['occurrences']), 1)

        occ = resp.data['occurrences'][0]
        self.assertEqual(occ['occurrence_number'], 1)
        self.assertEqual(occ['due_date'], '2026-11-15')
        self.assertEqual(occ['status'], OccurrenceStatus.UPCOMING)
        self.assertTrue(occ['payment_reference'].startswith('BILLZA-'))

    def test_bill_filtering_and_search(self):
        Bill.objects.create(user=self.user, name='Electricity Bill', category=BillCategory.ELECTRICITY, amount=Decimal('100.0'), due_date=date(2026, 11, 10))
        Bill.objects.create(user=self.user, name='Water Bill', category=BillCategory.WATER, amount=Decimal('40.0'), due_date=date(2026, 11, 20))

        # Filter by category
        resp = self.client.get('/api/bills/?category=ELECTRICITY')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['name'], 'Electricity Bill')

        # Search by name
        search_resp = self.client.get('/api/bills/?search=Water')
        self.assertEqual(len(search_resp.data), 1)
        self.assertEqual(search_resp.data[0]['name'], 'Water Bill')

    def test_manual_payment_and_recurrence_advancement(self):
        # 1. Create monthly bill
        bill = Bill.objects.create(
            user=self.user,
            name='Cloud Storage',
            category=BillCategory.SUBSCRIPTIONS,
            amount=Decimal('9.9900000'),
            currency='USDC',
            frequency=BillFrequency.MONTHLY,
            due_date=date(2026, 11, 1),
        )
        occ1 = BillOccurrence.objects.create(
            bill=bill,
            occurrence_number=1,
            due_date=date(2026, 11, 1),
            amount=Decimal('9.9900000'),
            currency='USDC',
            status=OccurrenceStatus.UPCOMING,
        )

        # 2. Mark occurrence #1 as manually paid
        resp = self.client.post(f'/api/bills/occurrences/{occ1.id}/mark-paid/', {'notes': 'Paid via cash receipt'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], OccurrenceStatus.PAID)
        self.assertTrue(resp.data['is_manual_paid'])

        # 3. Verify Occurrence #2 was automatically generated for Dec 1
        occurrences = BillOccurrence.objects.filter(bill=bill).order_by('occurrence_number')
        self.assertEqual(occurrences.count(), 2)

        occ2 = occurrences[1]
        self.assertEqual(occ2.occurrence_number, 2)
        self.assertEqual(occ2.due_date, date(2026, 12, 1))
        self.assertEqual(occ2.status, OccurrenceStatus.UPCOMING)
        self.assertFalse(occ2.is_manual_paid)

    def test_occurrence_snooze(self):
        bill = Bill.objects.create(user=self.user, name='Gym', category=BillCategory.OTHER, amount=Decimal('50.0'), due_date=date(2026, 11, 5))
        occ = BillOccurrence.objects.create(bill=bill, occurrence_number=1, due_date=date(2026, 11, 5), amount=Decimal('50.0'))

        resp = self.client.post(f'/api/bills/occurrences/{occ.id}/snooze/', {'days': 5}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['due_date'], '2026-11-10')
