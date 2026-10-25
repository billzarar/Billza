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

def process_scheduled_reminders(user=None) -> dict:
    """
    Main reminder worker entrypoint.
    Scans unpaid occurrences, identifies which alerts are due, creates and delivers them.
    If user is specified, processes occurrences for that user.
    """
    today = timezone.now().date()
    stats = {'evaluated': 0, 'created': 0, 'dispatched': 0, 'failed': 0}

    unpaid_occurrences = BillOccurrence.objects.filter(
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON, OccurrenceStatus.OVERDUE],
        bill__is_active=True,
    ).select_related('bill', 'bill__user')

    if user and user.is_authenticated:
        unpaid_occurrences = unpaid_occurrences.filter(bill__user=user)

    stats['evaluated'] = unpaid_occurrences.count()

    for occ in unpaid_occurrences:
        occ_user = occ.bill.user
        prefs, _ = NotificationPreference.objects.get_or_create(user=occ_user)

        days_remaining = (occ.due_date - today).days
        applicable_alerts = []

        if days_remaining < 0:
            if occ.bill.remind_overdue and prefs.remind_overdue:
                applicable_alerts.append((
                    ReminderType.OVERDUE,
                    f"Overdue Bill Alert: {occ.bill.name}",
                    today,
                    ReminderStatus.SENT,
                ))
        elif days_remaining == 0:
            if occ.bill.remind_on_due and prefs.remind_on_due:
                applicable_alerts.append((
                    ReminderType.ON_DUE_DATE,
                    f"Bill Due Today: {occ.bill.name}",
                    today,
                    ReminderStatus.SENT,
                ))
        elif days_remaining == 1:
            if occ.bill.remind_1_day and prefs.remind_1_day:
                applicable_alerts.append((
                    ReminderType.UPCOMING_1D,
                    f"Urgent: {occ.bill.name} is Due Tomorrow",
                    today,
                    ReminderStatus.SENT,
                ))
        elif 1 < days_remaining <= 3:
            if occ.bill.remind_3_days and prefs.remind_3_days:
                applicable_alerts.append((
                    ReminderType.UPCOMING_3D,
                    f"Upcoming in {days_remaining} Days: {occ.bill.name}",
                    today,
                    ReminderStatus.SENT,
                ))
        elif 3 < days_remaining <= 7:
            if occ.bill.remind_7_days and prefs.remind_7_days:
                applicable_alerts.append((
                    ReminderType.UPCOMING_7D,
                    f"Upcoming in {days_remaining} Days: {occ.bill.name}",
                    today,
                    ReminderStatus.SENT,
                ))
        else:
            # Future scheduled reminder (3 days before due date)
            sched_date = occ.due_date - timedelta(days=3)
            applicable_alerts.append((
                ReminderType.UPCOMING_3D,
                f"Scheduled Reminder: {occ.bill.name}",
                sched_date,
                ReminderStatus.SCHEDULED,
            ))

        for r_type, title, sched_for, rem_status in applicable_alerts:
            message = (
                f"Hello {occ_user.first_name or occ_user.username},\n\n"
                f"This is a reminder for your '{occ.bill.name}' bill ({occ.bill.get_category_display()}).\n"
                f"Amount: {occ.amount} {occ.currency}\n"
                f"Due Date: {occ.due_date}\n\n"
                f"Payment Reference: {occ.payment_reference}\n"
                f"You can initiate payment via Stellar Testnet or mark it as paid on your Billza dashboard."
            )

            # In-App Reminder
            if prefs.in_app_enabled and getattr(occ.bill, 'remind_in_app', True):
                in_app_rem, created = Reminder.objects.get_or_create(
                    occurrence=occ,
                    reminder_type=r_type,
                    channel=ReminderChannel.IN_APP,
                    defaults={
                        'user': occ_user,
                        'bill': occ.bill,
                        'scheduled_for': sched_for,
                        'title': title,
                        'message': message,
                        'status': rem_status,
                        'sent_at': timezone.now() if rem_status == ReminderStatus.SENT else None,
                    }
                )
                if created:
                    stats['created'] += 1
                    if rem_status == ReminderStatus.SENT:
                        stats['dispatched'] += 1

            # Email Reminder
            if (
                prefs.email_enabled
                and getattr(occ.bill, 'remind_email', True)
                and occ_user.email
                and not occ_user.email.endswith('@stellar.billza.local')
            ):
                email_rem, created = Reminder.objects.get_or_create(
                    occurrence=occ,
                    reminder_type=r_type,
                    channel=ReminderChannel.EMAIL,
                    defaults={
                        'user': occ_user,
                        'bill': occ.bill,
                        'scheduled_for': sched_for,
                        'title': title,
                        'message': message,
                        'status': ReminderStatus.SCHEDULED if rem_status == ReminderStatus.SCHEDULED else ReminderStatus.SENT,
                    }
                )
                if created:
                    stats['created'] += 1
                    if rem_status == ReminderStatus.SENT:
                        try:
                            send_mail(
                                subject=f"[Billza] {title}",
                                message=message,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[occ_user.email],
                                fail_silently=False,
                            )
                            email_rem.status = ReminderStatus.SENT
                            email_rem.sent_at = timezone.now()
                            email_rem.save(update_fields=['status', 'sent_at'])
                            stats['dispatched'] += 1
                        except Exception as e:
                            logger.error(f"Failed to send reminder email to {occ_user.email}: {e}")
                            email_rem.status = ReminderStatus.FAILED
                            email_rem.error_message = str(e)
                            email_rem.save(update_fields=['status', 'error_message'])
                            stats['failed'] += 1

    return stats
