import os
import django
from django.conf import settings
# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ridelink.settings')
django.setup()
from django.conf import settings
settings.ALLOWED_HOSTS += ['testserver']

from rest_framework.test import APIClient
from accounts.models import User
from rides.models import Ride, Booking
from stripe_payments.views import create_booking_checkout_session
import json
from unittest.mock import patch, MagicMock

def run_verification():
    print("Setting up test data...")
    # Create User
    user, _ = User.objects.get_or_create(username='testuser', email='test@example.com', phone_number='1234567890')
    driver, _ = User.objects.get_or_create(username='testdriver', email='driver@example.com', phone_number='0987654321')
    
    # Create Ride
    from django.utils import timezone
    ride = Ride.objects.create(
        driver=driver,
        departure_location="Test Loc",
        destination="Test Dest",
        departure_time=timezone.now(),
        available_seats=4,
        price=100.00
    )
    
    # Create Booking
    booking = Booking.objects.create(
        user=user,
        ride=ride,
        no_of_seats=2,
        status='pending'
    )
    print(f"Created booking {booking.id} with status {booking.status}")

    # Test 1: Create Booking Checkout Session
    print("\n--- Test 1: Create Booking Checkout Session ---")
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Mock stripe
    with patch('stripe.checkout.Session.create') as mock_stripe:
        mock_stripe.return_value = MagicMock(id='sess_123', url='http://test.com')
        
        response = client.post('/api/booking-checkout/', {'booking_id': booking.id}, format='json')
        
        if response.status_code == 200:
            print("SUCCESS: Checkout session created.")
            print(response.data)
        else:
            print(f"FAILED: {response.status_code}")
            print(response.data)

    # Test 2: Webhook
    print("\n--- Test 2: Process Webhook ---")
    from stripe_payments.views import stripe_webhook
    
    # Mock stripe webhook construction
    with patch('stripe.Webhook.construct_event') as mock_webhook:
        # Create event payload
        event_data = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'metadata': {
                        'type': 'booking',
                        'booking_id': str(booking.id),
                        'user_id': str(user.id)
                    }
                }
            }
        }
        mock_webhook.return_value = event_data
        
        # Simulate webhook call
        # Since we use csrf_exempt, we can use simple factory or client
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post(
            '/api/stripe/webhook/', 
            data=json.dumps(event_data), 
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )
        
        response = stripe_webhook(request)
        
        if response.status_code == 200:
            print("Webhook processed successfully.")
            
            # Verify booking status
            booking.refresh_from_db()
            print(f"Booking status: {booking.status}")
            print(f"Booking is_paid: {booking.is_paid}")
            
            if booking.status == 'confirmed' and booking.is_paid:
                print("SUCCESS: Booking confirmed and paid.")
            else:
                print("FAILED: Booking not updated correctly.")
        else:
            print(f"FAILED: Webhook returned {response.status_code}")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"An error occurred: {e}")
