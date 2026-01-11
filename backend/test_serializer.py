
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ridelink.settings')
django.setup()

from rides.models import Ride, Booking
from rides.serializers import BookingSerializer
from accounts.models import User

def test_serializer():
    # Get a dummy booking or create one
    try:
        user = User.objects.first()
        if not user:
            print("No users found.")
            return

        ride = Ride.objects.first()
        if not ride:
            print("No rides found.")
            return

        booking = Booking.objects.filter(user=user).first()
        
        if not booking:
            print("Creating a test booking...")
            booking = Booking.objects.create(
                user=user,
                ride=ride,
                no_of_seats=1,
                status='pending'
            )
        
        serializer = BookingSerializer(booking)
        print(json.dumps(serializer.data, indent=2, default=str))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_serializer()
