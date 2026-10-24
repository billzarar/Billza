from rest_framework import serializers
from .models import Reminder, NotificationPreference

class ReminderSerializer(serializers.ModelSerializer):
    bill_name = serializers.CharField(source='bill.name', read_only=True)
    bill_amount = serializers.DecimalField(source='occurrence.amount', max_digits=18, decimal_places=7, read_only=True)
    bill_currency = serializers.CharField(source='occurrence.currency', read_only=True)
    occurrence_due_date = serializers.DateField(source='occurrence.due_date', read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id',
            'bill',
            'bill_name',
            'bill_amount',
            'bill_currency',
            'occurrence',
            'occurrence_due_date',
            'reminder_type',
            'channel',
            'scheduled_for',
            'status',
            'title',
            'message',
            'sent_at',
            'read_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'bill',
            'occurrence',
            'reminder_type',
            'channel',
            'scheduled_for',
            'title',
            'message',
            'sent_at',
            'created_at',
        ]

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'email_enabled',
            'in_app_enabled',
            'remind_7_days',
            'remind_3_days',
            'remind_1_day',
            'remind_on_due',
            'remind_overdue',
        ]

class TriggerWorkerResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    evaluated = serializers.IntegerField()
    created = serializers.IntegerField()
    dispatched = serializers.IntegerField()
    failed = serializers.IntegerField()
