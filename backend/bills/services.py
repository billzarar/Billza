"""
Recurrence calculation engine and occurrence management service.
Handles month-end dates, leap years, and idempotent occurrence generation.
"""

import calendar
from datetime import date, timedelta
from typing import Optional
from django.db import transaction
from django.utils import timezone

from .models import Bill, BillOccurrence, BillFrequency, OccurrenceStatus

def add_months(sourcedate: date, months: int) -> date:
    """
    Safely advance date by N months, correctly handling month-end dates (e.g. Jan 31 -> Feb 28).
    """
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def calculate_next_due_date(current_due_date: date, frequency: str, repeat_every: int = 1) -> Optional[date]:
    """
    Calculate the next occurrence due date based on frequency and repeat_every interval multiplier.
    """
    step = max(1, repeat_every)
    if frequency == BillFrequency.WEEKLY:
        return current_due_date + timedelta(days=7 * step)
    elif frequency == BillFrequency.MONTHLY:
        return add_months(current_due_date, 1 * step)
    elif frequency == BillFrequency.QUARTERLY:
        return add_months(current_due_date, 3 * step)
    elif frequency == BillFrequency.YEARLY:
        year = current_due_date.year + step
        month = current_due_date.month
        day = min(current_due_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)
    return None

def create_initial_occurrence(bill: Bill) -> BillOccurrence:
    """
    Generate occurrence #1 for a newly created bill.
    """
    occ, _ = BillOccurrence.objects.get_or_create(
        bill=bill,
        occurrence_number=1,
        defaults={
            'due_date': bill.due_date,
            'amount': bill.amount,
            'currency': bill.currency,
            'status': OccurrenceStatus.UPCOMING,
        }
    )
    occ.update_dynamic_status()
    occ.save()
    return occ

def advance_recurring_bill(bill: Bill, completed_occurrence: BillOccurrence) -> Optional[BillOccurrence]:
    """
    When a recurring bill occurrence is paid, generate the next occurrence if:
    1. Bill is active.
    2. Bill frequency is recurring (not ONE_OFF).
    3. Next due date is <= bill.end_date (if end_date exists).
    4. Occurrence count does not exceed bill.end_occurrences (if ends_type == count).
    5. Next occurrence does not already exist.
    """
    if not bill.is_active or not bill.is_recurring:
        return None

    if getattr(bill, 'ends_type', 'never') == 'count' and bill.end_occurrences:
        if completed_occurrence.occurrence_number >= bill.end_occurrences:
            bill.is_active = False
            bill.save(update_fields=['is_active', 'updated_at'])
            return None

    repeat_step = getattr(bill, 'repeat_every', 1) or 1
    next_due_date = calculate_next_due_date(completed_occurrence.due_date, bill.frequency, repeat_step)
    if not next_due_date:
        return None

    # Check optional end date
    if bill.end_date and next_due_date > bill.end_date:
        bill.is_active = False
        bill.save(update_fields=['is_active'])
        return None

    next_number = completed_occurrence.occurrence_number + 1

    with transaction.atomic():
        # Prevent duplicate occurrence generation
        existing = BillOccurrence.objects.filter(bill=bill, occurrence_number=next_number).first()
        if existing:
            return existing

        next_occ = BillOccurrence.objects.create(
            bill=bill,
            occurrence_number=next_number,
            due_date=next_due_date,
            amount=bill.amount,
            currency=bill.currency,
            status=OccurrenceStatus.UPCOMING,
        )
        next_occ.update_dynamic_status()
        next_occ.save()

        # Update parent bill's current due_date pointer
        bill.due_date = next_due_date
        bill.save(update_fields=['due_date'])

    return next_occ
