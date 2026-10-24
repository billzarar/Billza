from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from bills.models import Bill, BillOccurrence, OccurrenceStatus, BillCategory
from reminders.models import Reminder, NotificationPreference, ReminderType, ReminderStatus
from reminders.services import process_scheduled_reminders

class RemindersTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='remindme', email='remindme@example.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_reminder_worker_evaluation_and_deduplication(self):
        today = timezone.now().date()

        # Bill due in 3 days
        bill_3d = Bill.objects.create(
            user=self.user,
            name='Water Utility',
            category=BillCategory.WATER,
            amount=Decimal('35.0'),
            due_date=today + timedelta(days=3),
        )
        BillOccurrence.objects.create(
            bill=bill_3d,
            occurrence_number=1,
            due_date=today + timedelta(days=3),
            amount=Decimal('35.0'),
            status=OccurrenceStatus.UPCOMING,
        )

        # Run worker
        stats1 = process_scheduled_reminders()
        self.assertGreaterEqual(stats1['created'], 1)

        # Verify in-app reminder exists
        reminder = Reminder.objects.filter(user=self.user, bill=bill_3d).first()
        self.assertIsNotNone(reminder)
        self.assertEqual(reminder.reminder_type, ReminderType.UPCOMING_3D)

        # Re-run worker (test deduplication)
        stats2 = process_scheduled_reminders()
        self.assertEqual(stats2['created'], 0) # No duplicate alerts

    def test_mark_reminder_as_read(self):
        bill = Bill.objects.create(user=self.user, name='Gas', category=BillCategory.OTHER, amount=Decimal('20.0'), due_date=timezone.now().date())
        occ = BillOccurrence.objects.create(bill=bill, occurrence_number=1, due_date=timezone.now().date(), amount=Decimal('20.0'))
        rem = Reminder.objects.create(
            user=self.user,
            bill=bill,
            occurrence=occ,
            reminder_type=ReminderType.ON_DUE_DATE,
            scheduled_for=timezone.now().date(),
            title='Due Today',
            message='Pay now',
            status=ReminderStatus.SENT,
        )

        resp = self.client.post(f'/api/reminders/{rem.id}/read/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        rem.refresh_from_db()
        self.assertEqual(rem.status, ReminderStatus.READ)
        self.assertIsNotNone(rem.read_at)

    def test_reminder_preferences(self):
        resp = self.client.get('/api/reminders/preferences/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        patch_resp = self.client.patch('/api/reminders/preferences/', {'remind_7_days': False}, format='json')
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(patch_resp.data['remind_7_days'])
