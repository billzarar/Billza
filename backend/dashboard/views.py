"""
Function-based views for dashboard overview and financial calculations.
"""

from decimal import Decimal
from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from bills.models import Bill, BillOccurrence, OccurrenceStatus, BillCategory
from bills.serializers import BillOccurrenceSerializer
from payments.models import PaymentRecord
from payments.serializers import PaymentRecordSerializer
from reminders.models import Reminder
from .serializers import DashboardMetricsResponseSerializer

@extend_schema(
    tags=['Dashboard'],
    summary='Retrieve comprehensive dashboard metrics and expense overview',
    description=(
        'Calculates summary statistics including total bills, upcoming deadlines, overdue alerts, '
        'monthly paid totals, currency-segregated expense breakdowns, and recent activity.'
    ),
    responses={200: DashboardMetricsResponseSerializer}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    user = request.user
    today = timezone.now().date()
    month_start = today.replace(day=1)

    # Refresh dynamic statuses on active occurrences
    active_occs = BillOccurrence.objects.filter(bill__user=user, bill__is_active=True).select_related('bill')
    for occ in active_occs:
        occ.update_dynamic_status()

    # 1. Counts
    total_bills_count = Bill.objects.filter(user=user, is_active=True).count()
    upcoming_bills_count = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON]
    ).count()
    overdue_bills_count = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status=OccurrenceStatus.OVERDUE
    ).count()

    # Paid this month
    paid_this_month_qs = BillOccurrence.objects.filter(
        bill__user=user,
        status=OccurrenceStatus.PAID,
        paid_at__date__gte=month_start,
    )
    paid_this_month_count = paid_this_month_qs.count()

    unread_reminders_count = Reminder.objects.filter(user=user, read_at__isnull=True).count()

    # 2. Financial aggregations segregated by currency (no artificial blending)
    # Scheduled upcoming expenses
    scheduled_by_curr_qs = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON, OccurrenceStatus.OVERDUE]
    ).values('currency').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('currency')

    scheduled_by_currency = [
        {
            'currency': row['currency'],
            'total_amount': row['total_amount'] or Decimal('0'),
            'count': row['count'],
        }
        for row in scheduled_by_curr_qs
    ]

    # Paid this month by currency
    paid_by_curr_qs = paid_this_month_qs.values('currency').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('currency')

    paid_this_month_by_currency = [
        {
            'currency': row['currency'],
            'total_amount': row['total_amount'] or Decimal('0'),
            'count': row['count'],
        }
        for row in paid_by_curr_qs
    ]

    # Category expense breakdown
    cat_qs = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON, OccurrenceStatus.OVERDUE, OccurrenceStatus.PAID]
    ).values('bill__category', 'currency').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('bill__category', 'currency')

    cat_display_map = dict(BillCategory.choices)
    category_breakdown = [
        {
            'category': row['bill__category'],
            'category_display': cat_display_map.get(row['bill__category'], row['bill__category']),
            'currency': row['currency'],
            'total_amount': row['total_amount'] or Decimal('0'),
            'count': row['count'],
        }
        for row in cat_qs
    ]

    # 3. Lists
    upcoming_occurrences = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON]
    ).select_related('bill').order_by('due_date')[:5]

    overdue_occurrences = BillOccurrence.objects.filter(
        bill__user=user,
        bill__is_active=True,
        status=OccurrenceStatus.OVERDUE
    ).select_related('bill').order_by('due_date')[:5]

    recent_payments = PaymentRecord.objects.filter(user=user).select_related('bill', 'occurrence').order_by('-created_at')[:5]

    data = {
        'total_bills_count': total_bills_count,
        'upcoming_bills_count': upcoming_bills_count,
        'overdue_bills_count': overdue_bills_count,
        'paid_this_month_count': paid_this_month_count,
        'unread_reminders_count': unread_reminders_count,
        'scheduled_by_currency': scheduled_by_currency,
        'paid_this_month_by_currency': paid_this_month_by_currency,
        'category_breakdown': category_breakdown,
        'upcoming_occurrences': BillOccurrenceSerializer(upcoming_occurrences, many=True).data,
        'overdue_occurrences': BillOccurrenceSerializer(overdue_occurrences, many=True).data,
        'recent_payments': PaymentRecordSerializer(recent_payments, many=True).data,
    }

    return Response(data, status=status.HTTP_200_OK)
