from django.db import models
from django.contrib.auth.models import User
from bills.models import Bill, BillOccurrence

class ReminderType(models.TextChoices):
    UPCOMING_7D = 'UPCOMING_7D', '7 Days Before'
    UPCOMING_3D = 'UPCOMING_3D', '3 Days Before'
    UPCOMING_1D = 'UPCOMING_1D', '1 Day Before'
    ON_DUE_DATE = 'ON_DUE_DATE', 'On Due Date'
    OVERDUE = 'OVERDUE', 'Overdue Alert'

class ReminderChannel(models.TextChoices):
    IN_APP = 'IN_APP', 'In-App Notification'
    EMAIL = 'EMAIL', 'Email Notification'

class ReminderStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    SENT = 'SENT', 'Sent'
    READ = 'READ', 'Read'
    FAILED = 'FAILED', 'Failed'

class Reminder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='reminders')
    occurrence = models.ForeignKey(BillOccurrence, on_delete=models.CASCADE, related_name='reminders')

    reminder_type = models.CharField(max_length=20, choices=ReminderType.choices)
    channel = models.CharField(max_length=20, choices=ReminderChannel.choices, default=ReminderChannel.IN_APP)
    scheduled_for = models.DateField(db_index=True)

    status = models.CharField(
        max_length=20,
        choices=ReminderStatus.choices,
        default=ReminderStatus.SCHEDULED,
        db_index=True,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()

    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_for', '-created_at']
        unique_together = ('occurrence', 'reminder_type', 'channel')

    def __str__(self):
        return f"{self.reminder_type} for {self.bill.name} [{self.status}]"

class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)

    remind_7_days = models.BooleanField(default=True)
    remind_3_days = models.BooleanField(default=True)
    remind_1_day = models.BooleanField(default=True)
    remind_on_due = models.BooleanField(default=True)
    remind_overdue = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"
