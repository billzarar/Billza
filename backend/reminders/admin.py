from django.contrib import admin
from .models import Reminder, NotificationPreference

@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'bill', 'reminder_type', 'channel', 'scheduled_for', 'status', 'sent_at', 'read_at')
    list_filter = ('reminder_type', 'channel', 'status', 'scheduled_for')
    search_fields = ('title', 'message', 'bill__name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_enabled', 'in_app_enabled', 'remind_7_days', 'remind_3_days', 'remind_1_day', 'remind_on_due', 'remind_overdue')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
