from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.admin_stats, name='admin_stats'),
    path('transactions/', views.admin_transactions, name='admin_transactions'),
    path('users/', views.admin_users, name='admin_users'),
]
