from django.db import models
from django.contrib.auth.models import User
from bills.models import Bill, BillOccurrence

class PaymentMethod(models.TextChoices):
    STELLAR_TESTNET = 'STELLAR_TESTNET', 'Stellar Testnet Payment'
    STELLAR_SOROBAN_CONTRACT = 'STELLAR_SOROBAN_CONTRACT', 'Stellar Soroban Smart Contract'
    MANUAL = 'MANUAL', 'Manual Record'

class VerificationStatus(models.TextChoices):
    AWAITING_SIGNATURE = 'AWAITING_SIGNATURE', 'Awaiting Wallet Signature'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    VERIFICATION_PENDING = 'VERIFICATION_PENDING', 'Verification Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class PaymentRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    occurrence = models.ForeignKey(BillOccurrence, on_delete=models.CASCADE, related_name='payments')

    amount = models.DecimalField(max_digits=18, decimal_places=7)
    asset = models.CharField(max_length=10, default='USDC')
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.STELLAR_TESTNET,
    )
    recipient_address = models.CharField(max_length=56, db_index=True)
    payer_address = models.CharField(max_length=56, blank=True, null=True, default='')

    transaction_hash = models.CharField(max_length=128, blank=True, default='', db_index=True)
    payment_reference = models.CharField(max_length=64, db_index=True)

    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.AWAITING_SIGNATURE,
        db_index=True,
    )
    error_message = models.TextField(blank=True, default='')
    ledger_sequence = models.PositiveIntegerField(null=True, blank=True)
    ledger_timestamp = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} for {self.bill.name} - {self.amount} {self.asset} [{self.verification_status}]"
