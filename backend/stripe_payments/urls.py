from django.urls import path
from . import views

urlpatterns = [
    #create checkout session, expects amount in the url
    path('checkout/<int:amount>/', views.create_topup_checkout_session, name='checkout'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
    path('payment/success/', views.payment_success, name='payment_success'),
    path('payment/cancelled/', views.payment_cancelled, name='payment_cancelled')

]