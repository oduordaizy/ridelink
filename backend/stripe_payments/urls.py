from django.urls import path
from . import views

urlpatterns = [
    #create checkout session, expects amount in the request body
    path('checkout/', views.create_topup_checkout_session, name='checkout'),
    path('booking-checkout/', views.create_booking_checkout_session, name='booking_checkout'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
    path('payment/success/', views.payment_success, name='payment_success'),
    path('payment/cancelled/', views.payment_cancelled, name='payment_cancelled')

]