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


#stripe checkout session view
stripe.api_key = settings.STRIPE_SECRET_KEY

def create_topup_checkout_session(request, amount):
    #converting the amount to the smallest currecncy unit
    amount_cents = int(amount * 100)

    #Form to let the user select amount

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items = [{
            'price_data': {
                'currency': 'ksh',
                'product_data':{
                    'name': 'Wallet Top Up'
                },
                'unit_amount': amount_cents
            },
            'quantity': 1
        }],
        mode='payment',
        success_url=request.build_absolute_uri(reverse('payment_succcess')),#Define success url
        cancel_url=request.build_absolute_uri(reverse('payment_cancel')),

        #Store user info so we know who to credit the money later
        metadata={'user_id': request.user.id, 'topup_amount': str(amount)}
    )
    return redirect(session.url, code=303)


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
        #invalid payload
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        #invalid signature
        return HttpResponse(status=400)
    
    #Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        amount_str = session.get('metadata',{}).get('topup_amount')

        if user_id and amount_str:
            try:
                user = User.objects.get(id=int(user_id))
                amount = float(amount_str)
                wallet, created = Wallet.objects.get_or_create(user=user)
                wallet.top_up(amount)

                #You can log this event or send a confirmation email
                print(f"Topped up {user.username}'s wallet by ${amount}")
            except User.DoesNotExist:
                print(f"User with ID {user_id} not found.")

        return HttpResponse(status=200)
    

def payment_success(request):
    return JsonResponse({'message': 'Payment successful!'})

def payment_cancelled(request):
    return JsonResponse({'message': 'Payment cancelled'})
