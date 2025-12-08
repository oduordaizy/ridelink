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
import jwt

stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
@require_http_methods(["POST"])
def create_topup_checkout_session(request, amount):
    # Get token from Authorization header
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode JWT WITHOUT verification (since it's from external auth server)
        # In production, you should verify the signature with the public key
        payload = jwt.decode(token, options={"verify_signature": False})
        user_uuid = payload.get('sub')  # This is the UUID from your JWT
        
        if not user_uuid:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        
        # Find user by UUID (adjust field name if needed)
        # If your User model uses 'id' as UUID, use: user = User.objects.get(id=user_uuid)
        # If it's a different field, adjust accordingly
        try:
            user = User.objects.get(id=user_uuid)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        # Convert amount to cents
        amount_cents = int(float(amount) * 100)
        
        # Validate amount
        if amount_cents < 1000:  # Minimum 10 KES
            return JsonResponse({'error': 'Minimum amount is KES 10'}, status=400)

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
        
        return JsonResponse({
            'checkout_url': session.url,
            'session_id': session.id
        })
        
    except jwt.DecodeError:
        return JsonResponse({'error': 'Invalid token format'}, status=401)
    except Exception as e:
        print(f"Error: {e}")  # Debug log
        return JsonResponse({'error': str(e)}, status=500)

    
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

    return HttpResponse(status=200)
    

def payment_success(request):
    return JsonResponse({'message': 'Payment successful!'})

def payment_cancelled(request):
    return JsonResponse({'message': 'Payment cancelled'})