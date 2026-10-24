from rest_framework import serializers
from .models import PaymentRecord, PaymentMethod, VerificationStatus

class PaymentRecordSerializer(serializers.ModelSerializer):
    bill_name = serializers.CharField(source='bill.name', read_only=True)
    bill_category = serializers.CharField(source='bill.category', read_only=True)
    occurrence_number = serializers.IntegerField(source='occurrence.occurrence_number', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = [
            'id',
            'bill',
            'bill_name',
            'bill_category',
            'occurrence',
            'occurrence_number',
            'amount',
            'asset',
            'payment_method',
            'recipient_address',
            'payer_address',
            'transaction_hash',
            'payment_reference',
            'verification_status',
            'error_message',
            'ledger_sequence',
            'ledger_timestamp',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'payment_reference',
            'verification_status',
            'error_message',
            'ledger_sequence',
            'ledger_timestamp',
            'created_at',
            'updated_at',
        ]

class PaymentPrepareRequestSerializer(serializers.Serializer):
    occurrence_id = serializers.IntegerField(required=True)
    payer_address = serializers.CharField(max_length=56, required=False, allow_blank=True, default='')

class PaymentPrepareResponseSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    occurrence_id = serializers.IntegerField()
    bill_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=18, decimal_places=7)
    asset = serializers.CharField()
    recipient_address = serializers.CharField()
    payer_address = serializers.CharField(allow_blank=True)
    payment_reference = serializers.CharField()
    estimated_network_fee = serializers.CharField()
    contract_id = serializers.CharField()
    network_passphrase = serializers.CharField()

class PaymentVerifyRequestSerializer(serializers.Serializer):
    occurrence_id = serializers.IntegerField(required=True)
    transaction_hash = serializers.CharField(max_length=128, required=True)
    payer_address = serializers.CharField(max_length=56, required=False, allow_blank=True, default='')

class FundWalletRequestSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=56, min_length=56, help_text="Stellar public key to fund on Testnet")

class StellarBalanceSerializer(serializers.Serializer):
    account_id = serializers.CharField()
    native_xlm = serializers.CharField()
    usdc = serializers.CharField()
    subentries = serializers.IntegerField(required=False, default=0)
    unfunded = serializers.BooleanField(required=False, default=False)
    message = serializers.CharField(required=False, allow_blank=True)
