import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

class BillCategory(models.TextChoices):
    ELECTRICITY = 'ELECTRICITY', 'Electricity'
    INTERNET = 'INTERNET', 'Internet'
    WATER = 'WATER', 'Water'
    RENT = 'RENT', 'Rent'
    SUBSCRIPTIONS = 'SUBSCRIPTIONS', 'Subscriptions'
    EDUCATION = 'EDUCATION', 'Education'
    INSURANCE = 'INSURANCE', 'Insurance'
    BUSINESS_UTILITIES = 'BUSINESS_UTILITIES', 'Business Utilities'
    OTHER = 'OTHER', 'Other'

class BillFrequency(models.TextChoices):
    ONE_OFF = 'ONE_OFF', 'One-Off'
    WEEKLY = 'WEEKLY', 'Weekly'
    MONTHLY = 'MONTHLY', 'Monthly'
    QUARTERLY = 'QUARTERLY', 'Quarterly'
    YEARLY = 'YEARLY', 'Yearly'

class AssetType(models.TextChoices):
    XLM = 'XLM', 'Stellar Lumens (XLM)'
    USDC = 'USDC', 'USD Coin (USDC)'
    USD = 'USD', 'US Dollar (Fiat Reference)'
    EUR = 'EUR', 'Euro (Fiat Reference)'

class OccurrenceStatus(models.TextChoices):
    UPCOMING = 'UPCOMING', 'Upcoming'
    DUE_SOON = 'DUE_SOON', 'Due Soon'
    OVERDUE = 'OVERDUE', 'Overdue'
    PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
    PAID = 'PAID', 'Paid'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Bill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bills')
    name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=50, choices=BillCategory.choices, default=BillCategory.OTHER, db_index=True)
    description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=18, decimal_places=7)
    currency = models.CharField(max_length=10, choices=AssetType.choices, default=AssetType.USDC)

    # Recipient payment details
    recipient_name = models.CharField(max_length=200, blank=True, default='')
    recipient_stellar_address = models.CharField(max_length=56, blank=True, default='', db_index=True)
    custom_category = models.CharField(max_length=100, blank=True, default='')
    payment_method = models.CharField(max_length=20, default='myself', help_text="'myself' or 'stellar'")
    account_reference = models.CharField(max_length=100, blank=True, default='', help_text="Optional account or reference number")

    # Recurrence configuration
    frequency = models.CharField(max_length=20, choices=BillFrequency.choices, default=BillFrequency.MONTHLY)
    repeat_every = models.PositiveIntegerField(default=1, help_text="Multiplier for frequency interval")
    ends_type = models.CharField(max_length=20, default='never', help_text="'never', 'date', or 'count'")
    end_occurrences = models.PositiveIntegerField(null=True, blank=True, help_text="Number of payments if ends_type is count")
    start_date = models.DateField(default=timezone.localdate)
    due_date = models.DateField(db_index=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Reminder timing flags
    remind_7_days = models.BooleanField(default=True)
    remind_3_days = models.BooleanField(default=True)
    remind_1_day = models.BooleanField(default=True)
    remind_on_due = models.BooleanField(default=True)
    remind_overdue = models.BooleanField(default=True)
    remind_in_app = models.BooleanField(default=True)
    remind_email = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'name']

    def __str__(self):
        return f"{self.name} - {self.amount} {self.currency} ({self.get_frequency_display()})"

    @property
    def is_recurring(self) -> bool:
        return self.frequency != BillFrequency.ONE_OFF

def generate_payment_reference():
    return f"BILLZA-{uuid.uuid4().hex[:12].upper()}"

class BillOccurrence(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='occurrences')
    occurrence_number = models.PositiveIntegerField(default=1)
    due_date = models.DateField(db_index=True)
    amount = models.DecimalField(max_digits=18, decimal_places=7)
    currency = models.CharField(max_length=10, choices=AssetType.choices, default=AssetType.USDC)
    status = models.CharField(
        max_length=30,
        choices=OccurrenceStatus.choices,
        default=OccurrenceStatus.UPCOMING,
        db_index=True,
    )
    is_manual_paid = models.BooleanField(default=False, help_text="True if marked manually without blockchain confirmation")
    payment_reference = models.CharField(
        max_length=64,
        unique=True,
        default=generate_payment_reference,
        db_index=True,
        help_text="Unique reference code used in Stellar transaction memo or Soroban call",
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    transaction_hash = models.CharField(max_length=128, blank=True, default='', db_index=True)
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'occurrence_number']
        unique_together = ('bill', 'occurrence_number')

    def __str__(self):
        return f"{self.bill.name} (Occurrence #{self.occurrence_number} due {self.due_date}) - {self.status}"

    def update_dynamic_status(self):
        """Update status based on current date if not paid or cancelled."""
        if self.status in (OccurrenceStatus.PAID, OccurrenceStatus.CANCELLED, OccurrenceStatus.PENDING_VERIFICATION):
            return
        today = timezone.now().date()
        if self.due_date < today:
            self.status = OccurrenceStatus.OVERDUE
        elif (self.due_date - today).days <= 3:
            self.status = OccurrenceStatus.DUE_SOON
        else:
            self.status = OccurrenceStatus.UPCOMING
