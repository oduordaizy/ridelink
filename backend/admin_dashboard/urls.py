from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.admin_stats, name='admin_stats'),
    path('transactions/', views.admin_transactions, name='admin_transactions'),
    path('users/', views.admin_users, name='admin_users'),
    path('mpesa/status/<int:transaction_id>/', views.mpesa_status, name='mpesa_status'),
    path('mpesa/reversal/<int:transaction_id>/', views.mpesa_reversal_view, name='mpesa_reversal'),
    path('mpesa/balance/', views.mpesa_balance, name='mpesa_balance'),
]
