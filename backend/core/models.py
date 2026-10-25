from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    wallet_address = models.CharField(max_length=56, blank=True, null=True, db_index=True)
    preferred_currency = models.CharField(max_length=10, default='USDC')
    email_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.wallet_address or 'No wallet'})"

class WalletNonce(models.Model):
    wallet_address = models.CharField(max_length=56, db_index=True)
    nonce = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_nonce(cls, wallet_address: str, lifetime_minutes: int = 15):
        import secrets
        nonce = secrets.token_hex(32)
        expires_at = timezone.now() + timedelta(minutes=lifetime_minutes)
        return cls.objects.create(
            wallet_address=wallet_address,
            nonce=nonce,
            expires_at=expires_at,
        )

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at}] {self.action} by {self.user}"
