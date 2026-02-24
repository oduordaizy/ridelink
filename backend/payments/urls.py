from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Wallet operations
    path('wallet/', views.wallet_view, name='wallet'),
    path('wallet/balance/', views.wallet_balance, name='wallet_balance'),
    path('wallet/transactions/', views.wallet_transactions, name='wallet_transactions'),
    path('wallet/topup/', views.topup_wallet, name='topup_wallet'),
    
    # MPESA operations
    path('mpesa/callback/', views.mpesa_callback, name='mpesa_callback'),
    path('mpesa/query/', views.query_mpesa_status, name='query_mpesa_status'),
]
