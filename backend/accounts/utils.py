import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

def generate_otp(length=6):
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(user, otp):
    """Send OTP to the user's email with a professional HTML template."""
    subject = 'Your Verification Code for iTravas'
    
    # Plain text version for fallback
    text_message = f"Hi {user.username},\n\nYour verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nThank you,\niTravas Team"
    
    # HTML version
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00204a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">iTravas</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi <strong>{user.username}</strong>,</p>
            <p style="font-size: 16px; color: #333333; line-height: 1.5;">Your verification code for iTravas is:</p>
            <div style="background-color: #f4f7f9; border-radius: 6px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00204a;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #666666; margin-bottom: 20px;">This code will expire in 10 minutes.</p>
            <p style="font-size: 16px; color: #333333; margin-top: 30px;">Thank you,<br><strong>iTravas Team</strong></p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999999; margin: 0;">&copy; 2026 iTravas. All rights reserved.</p>
        </div>
    </div>
    """
    
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(
            subject, 
            text_message, 
            email_from, 
            recipient_list,
            html_message=html_message
        )
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False
