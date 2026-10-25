from django.contrib import admin
from .models import Bill, BillOccurrence

class BillOccurrenceInline(admin.TabularInline):
    model = BillOccurrence
    extra = 0
    fields = ('occurrence_number', 'due_date', 'amount', 'currency', 'status', 'is_manual_paid', 'payment_reference')
    readonly_fields = ('payment_reference',)

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'amount', 'currency', 'frequency', 'repeat_every', 'category', 'custom_category', 'payment_method', 'due_date', 'is_active', 'recipient_stellar_address')
    list_filter = ('category', 'frequency', 'currency', 'payment_method', 'is_active', 'created_at')
    search_fields = ('name', 'custom_category', 'recipient_name', 'account_reference', 'recipient_stellar_address', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [BillOccurrenceInline]

@admin.register(BillOccurrence)
class BillOccurrenceAdmin(admin.ModelAdmin):
    list_display = ('bill', 'occurrence_number', 'due_date', 'amount', 'currency', 'status', 'is_manual_paid', 'payment_reference', 'paid_at')
    list_filter = ('status', 'currency', 'is_manual_paid', 'due_date')
    search_fields = ('bill__name', 'payment_reference', 'transaction_hash', 'bill__user__username')
    readonly_fields = ('created_at', 'updated_at', 'payment_reference')
