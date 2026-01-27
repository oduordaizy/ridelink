from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

def send_booking_confirmation_email(booking):
    """
    Send a booking confirmation email to the passenger.
    """
    subject = f'Booking Confirmed - Ride from {booking.ride.departure_location} to {booking.ride.destination}'
    
    departure_time = booking.ride.departure_time.strftime('%B %d, %Y at %I:%M %p')
    
    message = f"""
Hi {booking.user.first_name or booking.user.username},

Your booking has been confirmed!

Ride Details:
- From: {booking.ride.departure_location}
- To: {booking.ride.destination}
- Date & Time: {departure_time}
- Number of Seats: {booking.no_of_seats}
- Total Price: KSh {booking.ride.price * booking.no_of_seats}

Driver Details:
- Name: {booking.ride.driver.first_name} {booking.ride.driver.last_name}
- Phone: {booking.ride.driver.phone_number or 'Not provided'}

Thank you for choosing Travas!
"""
    
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [booking.user.email]
    
    try:
        send_mail(subject, message, email_from, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending booking confirmation email: {e}")
        return False

def send_new_booking_notification_to_driver(booking):
    """
    Send an email notification to the driver about a new booking (pending or confirmed).
    """
    subject = f'New Booking Request - Ride to {booking.ride.destination}'
    
    message = f"""
Hi {booking.ride.driver.first_name or booking.ride.driver.username},

You have a new booking request for your ride from {booking.ride.departure_location} to {booking.ride.destination}.

Booking Details:
- Passenger: {booking.user.first_name} {booking.user.last_name} ({booking.user.username})
- Number of Seats: {booking.no_of_seats}
- Status: {booking.status.capitalize()}

Log in to your dashboard to manage your rides.

Thank you,
Travas Team
"""
    
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [booking.ride.driver.email]
    
    try:
        send_mail(subject, message, email_from, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending driver notification email: {e}")
        return False
