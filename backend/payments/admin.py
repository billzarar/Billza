from django.contrib import admin
from .models import PaymentRecord

@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'bill', 'user', 'amount', 'asset', 'payment_method', 'verification_status', 'transaction_hash', 'created_at')
    list_filter = ('verification_status', 'payment_method', 'asset', 'created_at')
    search_fields = ('bill__name', 'transaction_hash', 'payment_reference', 'recipient_address', 'payer_address', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
