from django.contrib import admin
from .models import UserProfile, WalletNonce, AuditLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'wallet_address', 'preferred_currency', 'email_notifications', 'in_app_notifications', 'created_at')
    search_fields = ('user__username', 'user__email', 'wallet_address')
    list_filter = ('preferred_currency', 'email_notifications', 'in_app_notifications', 'created_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(WalletNonce)
class WalletNonceAdmin(admin.ModelAdmin):
    list_display = ('wallet_address', 'nonce', 'is_used', 'created_at', 'expires_at')
    search_fields = ('wallet_address', 'nonce')
    list_filter = ('is_used', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'ip_address', 'created_at')
    search_fields = ('action', 'user__username', 'ip_address', 'details')
    list_filter = ('action', 'created_at')
    readonly_fields = ('created_at',)
