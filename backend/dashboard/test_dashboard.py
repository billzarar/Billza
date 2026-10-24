from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from bills.models import Bill, BillOccurrence, OccurrenceStatus, BillCategory, AssetType

class DashboardTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='dashuser', email='dashuser@example.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_dashboard_overview_metrics(self):
        today = timezone.now().date()

        # Bill 1: 50 XLM Upcoming
        b1 = Bill.objects.create(user=self.user, name='Server XLM', category=BillCategory.BUSINESS_UTILITIES, amount=Decimal('50.0'), currency=AssetType.XLM, due_date=today + timedelta(days=2))
        BillOccurrence.objects.create(bill=b1, occurrence_number=1, due_date=today + timedelta(days=2), amount=Decimal('50.0'), currency=AssetType.XLM, status=OccurrenceStatus.UPCOMING)

        # Bill 2: 120 USDC Overdue
        b2 = Bill.objects.create(user=self.user, name='Office Rent', category=BillCategory.RENT, amount=Decimal('120.0'), currency=AssetType.USDC, due_date=today - timedelta(days=5))
        BillOccurrence.objects.create(bill=b2, occurrence_number=1, due_date=today - timedelta(days=5), amount=Decimal('120.0'), currency=AssetType.USDC, status=OccurrenceStatus.OVERDUE)

        # Bill 3: 30 USDC Paid
        b3 = Bill.objects.create(user=self.user, name='Spotify', category=BillCategory.SUBSCRIPTIONS, amount=Decimal('30.0'), currency=AssetType.USDC, due_date=today - timedelta(days=2))
        BillOccurrence.objects.create(bill=b3, occurrence_number=1, due_date=today - timedelta(days=2), amount=Decimal('30.0'), currency=AssetType.USDC, status=OccurrenceStatus.PAID, paid_at=timezone.now())

        resp = self.client.get('/api/dashboard/overview/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.assertEqual(resp.data['total_bills_count'], 3)
        self.assertEqual(resp.data['upcoming_bills_count'], 1)
        self.assertEqual(resp.data['overdue_bills_count'], 1)
        self.assertEqual(resp.data['paid_this_month_count'], 1)

        # Verify currencies are cleanly segregated (XLM vs USDC)
        scheduled_currencies = {item['currency']: Decimal(str(item['total_amount'])) for item in resp.data['scheduled_by_currency']}
        self.assertEqual(scheduled_currencies.get('XLM'), Decimal('50.0'))
        self.assertEqual(scheduled_currencies.get('USDC'), Decimal('120.0'))
