import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

def generate_otp(length=6):
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(user, otp):
    """Send OTP to the user's email."""
    subject = 'Your Verification Code for iTravas'
    message = f'Hi {user.username},\\n\\nYour verification code is: {otp}\\n\\nThis code will expire in 10 minutes.\\n\\nThank you,\\niTravas Team'
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(subject, message, email_from, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
