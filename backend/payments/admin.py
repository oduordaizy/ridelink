from django.contrib import admin
from .models import Wallet, Transaction

# Register your models here.

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__username', 'user__email')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'amount', 'status', 'mpesa_receipt_number', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('mpesa_receipt_number', 'checkout_request_id', 'wallet__user__username')
    readonly_fields = ('created_at', 'completed_at')