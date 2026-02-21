from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import threading

def send_booking_confirmation_email(booking):
    """
    Send a booking confirmation email to the passenger in a background thread with an HTML template.
    """
    subject = f'Booking Confirmed - Ride to {booking.ride.destination}'
    
    departure_time = booking.ride.departure_time.strftime('%B %d, %Y at %I:%M %p')
    passenger_name = booking.user.first_name or booking.user.username
    total_price = booking.ride.price * booking.no_of_seats
    
    # Plain text version
    text_message = f"""
Hi {passenger_name},

Your booking has been confirmed!

Ride Details:
- From: {booking.ride.departure_location}
- To: {booking.ride.destination}
- Date & Time: {departure_time}
- Number of Seats: {booking.no_of_seats}
- Total Price: KSh {total_price}

Driver Details:
- Name: {booking.ride.driver.first_name} {booking.ride.driver.last_name}
- Phone: {booking.ride.driver.phone_number or 'Not provided'}

Thank you for choosing iTravas!
"""
    
    # HTML version
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00204a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">iTravas</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #00204a; margin-top: 0;">Booking Confirmed! ✅</h2>
            <p style="font-size: 16px; color: #333333;">Hi <strong>{passenger_name}</strong>, your ride has been secured.</p>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                <h3 style="margin-top: 0; font-size: 16px; color: #00204a; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Ride Details</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0; color: #666666;">From:</td><td style="padding: 5px 0; font-weight: bold;">{booking.ride.departure_location}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">To:</td><td style="padding: 5px 0; font-weight: bold;">{booking.ride.destination}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">Date:</td><td style="padding: 5px 0; font-weight: bold;">{departure_time}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">Seats:</td><td style="padding: 5px 0; font-weight: bold;">{booking.no_of_seats}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">Total:</td><td style="padding: 5px 0; color: #00204a; font-weight: bold; font-size: 16px;">KSh {total_price}</td></tr>
                </table>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                <h3 style="margin-top: 0; font-size: 16px; color: #00204a; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Driver Information</h3>
                <p style="font-size: 14px; margin: 10px 0;"><strong>Name:</strong> {booking.ride.driver.first_name} {booking.ride.driver.last_name}</p>
                <p style="font-size: 14px; margin: 10px 0;"><strong>Phone:</strong> <a href="tel:{booking.ride.driver.phone_number}" style="color: #007bff; text-decoration: none;">{booking.ride.driver.phone_number or 'Not provided'}</a></p>
            </div>

            <p style="font-size: 16px; color: #333333; margin-top: 30px;">Thank you for choosing <strong>iTravas</strong>!</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999999; margin: 0;">&copy; 2026 iTravas. All rights reserved.</p>
        </div>
    </div>
    """
    
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [booking.user.email]
    
    def send():
        try:
            send_mail(subject, text_message, email_from, recipient_list, html_message=html_message)
        except Exception as e:
            print(f"Error sending booking confirmation email: {e}")

    # Send in background to avoid blocking the user
    thread = threading.Thread(target=send)
    thread.start()
    return True

def send_new_booking_notification_to_driver(booking):
    """
    Send an email notification to the driver about a new booking in a background thread with an HTML template.
    """
    subject = f'New Booking Request - Ride to {booking.ride.destination}'
    driver_name = booking.ride.driver.first_name or booking.ride.driver.username
    passenger_full_name = f"{booking.user.first_name} {booking.user.last_name}"
    
    # Plain text version
    text_message = f"""
Hi {driver_name},

You have a new booking request for your ride from {booking.ride.departure_location} to {booking.ride.destination}.

Booking Details:
- Passenger: {passenger_full_name}
- Number of Seats: {booking.no_of_seats}
- Status: {booking.status.capitalize()}

Log in to your dashboard to manage your rides.

Thank you,
iTravas Team
"""
    
    # HTML version
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00204a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">iTravas</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #00204a; margin-top: 0;">New Booking Request! 🚗</h2>
            <p style="font-size: 16px; color: #333333;">Hi <strong>{driver_name}</strong>, you have a new passenger for your ride to <strong>{booking.ride.destination}</strong>.</p>
            
            <div style="background-color: #f4f7f9; border-radius: 6px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0; color: #666666;">Passenger:</td><td style="padding: 5px 0; font-weight: bold;">{passenger_full_name}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">Seats Requested:</td><td style="padding: 5px 0; font-weight: bold;">{booking.no_of_seats}</td></tr>
                    <tr><td style="padding: 5px 0; color: #666666;">Status:</td><td style="padding: 5px 0; color: #28a745; font-weight: bold;">{booking.status.capitalize()}</td></tr>
                </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://itravas.com/auth/login" style="background-color: #00204a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>

            <p style="font-size: 16px; color: #333333; margin-top: 30px;">Thank you,<br><strong>iTravas Team</strong></p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999999; margin: 0;">&copy; 2026 iTravas. All rights reserved.</p>
        </div>
    </div>
    """
    
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [booking.ride.driver.email]
    
    def send():
        try:
            send_mail(subject, text_message, email_from, recipient_list, html_message=html_message)
        except Exception as e:
            print(f"Error sending driver notification email: {e}")

    # Send in background to avoid blocking the user
    thread = threading.Thread(target=send)
    thread.start()
    return True
