from rest_framework import serializers
from bills.serializers import BillOccurrenceSerializer
from payments.serializers import PaymentRecordSerializer

class CurrencyBreakdownSerializer(serializers.Serializer):
    currency = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=18, decimal_places=7)
    count = serializers.IntegerField()

class CategoryExpenseSerializer(serializers.Serializer):
    category = serializers.CharField()
    category_display = serializers.CharField()
    currency = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=18, decimal_places=7)
    count = serializers.IntegerField()

class DashboardMetricsResponseSerializer(serializers.Serializer):
    total_bills_count = serializers.IntegerField()
    upcoming_bills_count = serializers.IntegerField()
    overdue_bills_count = serializers.IntegerField()
    paid_this_month_count = serializers.IntegerField()
    unread_reminders_count = serializers.IntegerField()

    scheduled_by_currency = CurrencyBreakdownSerializer(many=True)
    paid_this_month_by_currency = CurrencyBreakdownSerializer(many=True)
    category_breakdown = CategoryExpenseSerializer(many=True)

    upcoming_occurrences = BillOccurrenceSerializer(many=True)
    overdue_occurrences = BillOccurrenceSerializer(many=True)
    recent_payments = PaymentRecordSerializer(many=True)
