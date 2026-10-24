from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Bill, BillOccurrence, BillCategory, BillFrequency, AssetType, OccurrenceStatus

class BillOccurrenceSerializer(serializers.ModelSerializer):
    bill_name = serializers.CharField(source='bill.name', read_only=True)
    bill_category = serializers.CharField(source='bill.category', read_only=True)
    recipient_stellar_address = serializers.CharField(source='bill.recipient_stellar_address', read_only=True)
    recipient_name = serializers.CharField(source='bill.recipient_name', read_only=True)

    class Meta:
        model = BillOccurrence
        fields = [
            'id',
            'bill',
            'bill_name',
            'bill_category',
            'occurrence_number',
            'due_date',
            'amount',
            'currency',
            'status',
            'is_manual_paid',
            'payment_reference',
            'paid_at',
            'transaction_hash',
            'notes',
            'recipient_stellar_address',
            'recipient_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'occurrence_number',
            'payment_reference',
            'is_manual_paid',
            'paid_at',
            'transaction_hash',
            'created_at',
            'updated_at',
        ]

class BillSerializer(serializers.ModelSerializer):
    occurrences = BillOccurrenceSerializer(many=True, read_only=True)
    current_occurrence = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id',
            'name',
            'category',
            'category_display',
            'description',
            'amount',
            'currency',
            'recipient_name',
            'recipient_stellar_address',
            'frequency',
            'frequency_display',
            'start_date',
            'due_date',
            'end_date',
            'is_active',
            'remind_7_days',
            'remind_3_days',
            'remind_1_day',
            'remind_on_due',
            'remind_overdue',
            'current_occurrence',
            'occurrences',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(BillOccurrenceSerializer)
    def get_current_occurrence(self, obj):
        occ = obj.occurrences.filter(status__in=[OccurrenceStatus.UPCOMING, OccurrenceStatus.DUE_SOON, OccurrenceStatus.OVERDUE]).first()
        if not occ:
            occ = obj.occurrences.last()
        return BillOccurrenceSerializer(occ).data if occ else None

class BillCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = [
            'name',
            'category',
            'description',
            'amount',
            'currency',
            'recipient_name',
            'recipient_stellar_address',
            'frequency',
            'start_date',
            'due_date',
            'end_date',
            'remind_7_days',
            'remind_3_days',
            'remind_1_day',
            'remind_on_due',
            'remind_overdue',
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bill amount must be strictly greater than zero.")
        return value

    def validate_recipient_stellar_address(self, value):
        if value:
            from stellar_sdk import Keypair
            try:
                Keypair.from_public_key(value)
            except Exception:
                raise serializers.ValidationError("Recipient address must be a valid Stellar public key (starting with G).")
        return value

class OccurrenceMarkManualPaidSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default='')

class OccurrenceSnoozeSerializer(serializers.Serializer):
    days = serializers.IntegerField(default=3, min_value=1, max_value=60)
