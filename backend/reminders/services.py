"""
Automated reminder processing service.
Inspects upcoming and overdue bills, respects user preferences, and idempotently dispatches alerts.
"""

import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

from bills.models import BillOccurrence, OccurrenceStatus
from .models import Reminder, NotificationPreference, ReminderType, ReminderChannel, ReminderStatus

logger = logging.getLogger(__name__)

def process_scheduled_reminders() -> dict:
    """
    Main reminder worker entrypoint.
    Scans unpaid occurrences, identifies which alerts are due today, creates and delivers them.
    """
    today = timezone.now().date()
    stats = {'evaluated': 0, 'created': 0, 'dispatched': 0, 'failed': 0}

    unpaid_occurrences = BillOccurrence.objects.filter(
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON, OccurrenceStatus.OVERDUE],
        bill__is_active=True,
    ).select_related('bill', 'bill__user')

    stats['evaluated'] = unpaid_occurrences.count()

    for occ in unpaid_occurrences:
        user = occ.bill.user
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)

        days_remaining = (occ.due_date - today).days
        applicable_types = []

        if days_remaining == 7 and occ.bill.remind_7_days and prefs.remind_7_days:
            applicable_types.append((ReminderType.UPCOMING_7D, f"Upcoming Bill in 7 Days: {occ.bill.name}"))
        elif days_remaining == 3 and occ.bill.remind_3_days and prefs.remind_3_days:
            applicable_types.append((ReminderType.UPCOMING_3D, f"Upcoming Bill in 3 Days: {occ.bill.name}"))
        elif days_remaining == 1 and occ.bill.remind_1_day and prefs.remind_1_day:
            applicable_types.append((ReminderType.UPCOMING_1D, f"Urgent: {occ.bill.name} is Due Tomorrow"))
        elif days_remaining == 0 and occ.bill.remind_on_due and prefs.remind_on_due:
            applicable_types.append((ReminderType.ON_DUE_DATE, f"Bill Due Today: {occ.bill.name}"))
        elif days_remaining < 0 and occ.bill.remind_overdue and prefs.remind_overdue:
            applicable_types.append((ReminderType.OVERDUE, f"Overdue Bill Alert: {occ.bill.name}"))

        for r_type, title in applicable_types:
            message = (
                f"Hello {user.first_name or user.username},\n\n"
                f"This is a reminder for your '{occ.bill.name}' bill ({occ.bill.get_category_display()}).\n"
                f"Amount: {occ.amount} {occ.currency}\n"
                f"Due Date: {occ.due_date}\n\n"
                f"Payment Reference: {occ.payment_reference}\n"
                f"You can initiate payment via Stellar Testnet or mark it as paid on your Billza dashboard."
            )

            # In-App Reminder
            if prefs.in_app_enabled:
                in_app_rem, created = Reminder.objects.get_or_create(
                    occurrence=occ,
                    reminder_type=r_type,
                    channel=ReminderChannel.IN_APP,
                    defaults={
                        'user': user,
                        'bill': occ.bill,
                        'scheduled_for': today,
                        'title': title,
                        'message': message,
                        'status': ReminderStatus.SENT,
                        'sent_at': timezone.now(),
                    }
                )
                if created:
                    stats['created'] += 1
                    stats['dispatched'] += 1

            # Email Reminder
            if prefs.email_enabled and user.email and not user.email.endswith('@stellar.billza.local'):
                email_rem, created = Reminder.objects.get_or_create(
                    occurrence=occ,
                    reminder_type=r_type,
                    channel=ReminderChannel.EMAIL,
                    defaults={
                        'user': user,
                        'bill': occ.bill,
                        'scheduled_for': today,
                        'title': title,
                        'message': message,
                        'status': ReminderStatus.SCHEDULED,
                    }
                )
                if created:
                    stats['created'] += 1
                    try:
                        send_mail(
                            subject=f"[Billza] {title}",
                            message=message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                        email_rem.status = ReminderStatus.SENT
                        email_rem.sent_at = timezone.now()
                        email_rem.save(update_fields=['status', 'sent_at'])
                        stats['dispatched'] += 1
                    except Exception as e:
                        logger.error(f"Failed to send reminder email to {user.email}: {e}")
                        email_rem.status = ReminderStatus.FAILED
                        email_rem.error_message = str(e)
                        email_rem.save(update_fields=['status', 'error_message'])
                        stats['failed'] += 1

    return stats
