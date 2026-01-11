from django.shortcuts import render
import stripe
from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from payments.models import Wallet
from accounts.models import User
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework import status
import jwt
from rides.models import Booking

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_topup_checkout_session(request):
    try:
        # Get the authenticated user
        user = request.user
        if user.is_anonymous:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get amount from request body
        data = request.data
        amount = data.get("amount")
        
        if not amount:
            return Response(
                {"error": "Amount is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid amount. Must be a positive number."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount to cents
        amount_cents = int(amount * 100)
        
        # Validate amount
        if amount_cents < 1000:  # Minimum 10 KES
            return Response(
                {"error": "Minimum amount is KES 10"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'kes',
                    'product_data': {
                        'name': 'Wallet Top Up'
                    },
                    'unit_amount': amount_cents
                },
                'quantity': 1
            }],
            mode='payment',
            success_url='http://localhost:3000/wallet/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/wallet?canceled=true',
            metadata={'user_id': str(user.id), 'topup_amount': str(amount)}
        )
        
        return Response({
            'checkout_url': session.url,
            'session_id': session.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error: {e}")  # Debug log
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking_checkout_session(request):
    try:
        # Get the authenticated user
        user = request.user
        
        # Get booking_id from request body
        data = request.data
        booking_id = data.get("booking_id")
        
        if not booking_id:
            return Response(
                {"error": "Booking ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            booking = Booking.objects.get(id=booking_id, user=user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status == 'confirmed' and booking.is_paid:
             return Response(
                {"error": "Booking is already paid for"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Calculate amount
        amount = booking.ride.price * booking.no_of_seats
        amount_cents = int(amount * 100)
        
         # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'kes',
                    'product_data': {
                        'name': f'Booking for {booking.ride}'
                    },
                    'unit_amount': amount_cents
                },
                'quantity': 1
            }],
            mode='payment',
            success_url=f'http://localhost:3000/bookings/{booking.id}/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'http://localhost:3000/bookings/{booking.id}?canceled=true',
            metadata={
                'user_id': str(user.id), 
                'type': 'booking',
                'booking_id': str(booking.id)
            }
        )
        
        return Response({
            'checkout_url': session.url,
            'session_id': session.id
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error: {e}") 
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        payment_type = session.get('metadata', {}).get('type', 'topup') # Default to topup for backward compatibility if possible, or handle strictly
        
        if payment_type == 'topup':
            amount_str = session.get('metadata', {}).get('topup_amount')

            if user_id and amount_str:
                try:
                    user = User.objects.get(id=int(user_id))
                    amount = float(amount_str)
                    wallet, created = Wallet.objects.get_or_create(user=user)
                    wallet.top_up(amount)

                    print(f"Topped up {user.username}'s wallet by KES {amount}")
                except User.DoesNotExist:
                    print(f"User with ID {user_id} not found.")
                except Exception as e:
                    print(f"Error processing payment: {e}")

        elif payment_type == 'booking':
            booking_id = session.get('metadata', {}).get('booking_id')
            if booking_id:
                try:
                    booking = Booking.objects.get(id=int(booking_id))
                    # Check if already paid to avoid double processing
                    if not booking.is_paid:
                        booking.confirm_payment()
                        print(f"Booking {booking.id} confirmed via Stripe")
                except Booking.DoesNotExist:
                    print(f"Booking with ID {booking_id} not found.")
                except Exception as e:
                    print(f"Error processing booking payment: {e}")

    return HttpResponse(status=200)
    

def payment_success(request):
    return JsonResponse({'message': 'Payment successful!'})

def payment_cancelled(request):
    return JsonResponse({'message': 'Payment cancelled'})