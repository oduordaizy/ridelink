from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from accounts.models import User, Driver, Passenger
from rides.models import Ride, Booking
from payments.models import Transaction, Wallet

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """
    Get aggregated statistics for the admin dashboard.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # User Stats
    total_users = User.objects.count()
    total_drivers = Driver.objects.count()
    total_passengers = Passenger.objects.count()
    new_users_today = User.objects.filter(date_joined__gte=today_start).count()
    
    # Ride/Booking Stats
    total_rides = Ride.objects.count()
    active_rides = Ride.objects.filter(departure_time__gte=now).count()
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    
    # Revenue Stats
    # Assuming platform fee is collected per confirmed booking
    total_revenue = Booking.objects.filter(status='confirmed', is_paid=True).aggregate(
        total=Sum('ride__platform_fee')
    )['total'] or 0
    
    # Payment Stats
    success_payments = Transaction.objects.filter(status='success').count()
    failed_payments = Transaction.objects.filter(status='failed').count()
    total_transaction_volume = Transaction.objects.filter(status='success').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    return Response({
        'users': {
            'total': total_users,
            'drivers': total_drivers,
            'passengers': total_passengers,
            'new_today': new_users_today
        },
        'rides': {
            'total': total_rides,
            'active': active_rides,
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings
        },
        'financials': {
            'total_revenue': float(total_revenue),
            'transaction_volume': float(total_transaction_volume),
            'success_rate': (success_payments / (success_payments + failed_payments) * 100) if (success_payments + failed_payments) > 0 else 0
        },
        'payments': {
            'successful': success_payments,
            'failed': failed_payments
        }
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_transactions(request):
    """List all transactions for admin oversight."""
    transactions = Transaction.objects.all().order_by('-created_at')[:100]
    data = [{
        'id': tx.id,
        'user': tx.wallet.user.username,
        'amount': float(tx.amount),
        'status': tx.status,
        'receipt': tx.mpesa_receipt_number,
        'description': tx.result_desc,
        'date': tx.created_at
    } for tx in transactions]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users(request):
    """List users for admin management, with optional type filtering."""
    user_type = request.query_params.get('user_type')
    users = User.objects.all().order_by('-date_joined')
    
    if user_type in ['driver', 'passenger']:
        users = users.filter(user_type=user_type)
        
    users = users[:100] # Limit to most recent 100
    
    data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'type': user.user_type,
        'is_verified': user.is_verified,
        'date_joined': user.date_joined,
        'phone_number': user.phone_number,
        'license_number': getattr(user, 'driver_profile', None).license_number if hasattr(user, 'driver_profile') else None,
        'vehicle_plate': getattr(user, 'driver_profile', None).vehicle_plate if hasattr(user, 'driver_profile') else None,
    } for user in users]
    return Response(data)
