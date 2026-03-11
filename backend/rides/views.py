# rides/views.py
import logging
from rest_framework import viewsets, status, permissions, filters

logger = logging.getLogger(__name__)
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import OrderingFilter
from django_filters import rest_framework as django_filters
from django.db.models import Q
from django.utils import timezone
from django.db import transaction as db_transaction
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from decimal import Decimal

from .serializers import (
    RideListSerializer, RideDetailSerializer,
    BookingSerializer, ReviewSerializer
)
from .models import Ride, Booking, Review
from payments.models import Wallet, Transaction
from payments.mpesa import lipa_na_mpesa
from accounts.models import Notification, Driver



class RideFilter(django_filters.FilterSet):
    departure_location = django_filters.CharFilter(lookup_expr='icontains')
    destination = django_filters.CharFilter(lookup_expr='icontains')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_seats = django_filters.NumberFilter(field_name='available_seats', lookup_expr='gte')
    date_after = django_filters.DateTimeFilter(field_name='departure_time', lookup_expr='gte')
    date_before = django_filters.DateTimeFilter(field_name='departure_time', lookup_expr='lte')

    class Meta:
        model = Ride
        fields = [
            'departure_location', 'destination', 'min_price', 'max_price',
            'min_seats', 'date_after', 'date_before', 'status', 'driver'
        ]

class IsDriverOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
         # Allow all safe methods (GET, HEAD, OPTIONS) for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Only allow drivers to write
        return request.user.is_authenticated and request.user.user_type == 'driver'

    def has_object_permission(self, request, view, obj):
         # Allow read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions only for the driver who created the ride
        return obj.driver == request.user
    
class RideViewSet(viewsets.ModelViewSet):
    queryset = Ride.objects.all()
    serializer_class = RideListSerializer
    permission_classes = [IsDriverOrReadOnly]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = RideFilter
    ordering_fields = ['departure_time', 'price', 'available_seats']
    ordering = ['departure_time']

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_profile_complete:
            missing = []
            if not user.profile_picture or 'default-profile.png' in user.profile_picture.name:
                missing.append("Profile Picture")
            
            if user.user_type == 'driver':
                try:
                    profile = user.driver_profile
                    if not profile.license_number: missing.append("License Number")
                    if not profile.vehicle_model: missing.append("Vehicle Model")
                    if not profile.vehicle_color: missing.append("Vehicle Color")
                    if not profile.vehicle_plate: missing.append("Vehicle Plate")
                except Driver.DoesNotExist:
                    missing.append("Driver Profile Information")

            return Response({
                "error": "Profile Incomplete",
                "detail": "Please complete your profile before posting a ride.",
                "missing_fields": missing
            }, status=status.HTTP_403_FORBIDDEN)
            
        # 5% Platform Fee Logic
        try:
            price = Decimal(str(request.data.get('price', 0)))
            available_seats = int(request.data.get('available_seats', 1))
            platform_fee = price * available_seats * Decimal('0.05')
            payment_method = request.data.get('payment_method', 'wallet')

            if platform_fee < 1:  # Minimum fee of 1 KES
                platform_fee = Decimal('1.00')

            with db_transaction.atomic():
                if payment_method == 'wallet':
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    # We use select_for_update to lock the wallet row
                    wallet = Wallet.objects.select_for_update().get(id=wallet.id)
                    
                    if wallet.balance < platform_fee:
                        return Response({
                            "error": "Insufficient Balance",
                            "detail": f"Your wallet balance (KES {wallet.balance}) is insufficient to pay the platform fee (KES {platform_fee}).",
                            "fee": float(platform_fee)
                        }, status=status.HTTP_402_PAYMENT_REQUIRED)

                    # Create the ride
                    serializer = self.get_serializer(data=request.data)
                    serializer.is_valid(raise_exception=True)
                    ride = serializer.save(driver=user, platform_fee=platform_fee, status='available')

                    # Deduct from wallet
                    wallet.balance -= platform_fee
                    wallet.save()

                    # Create transaction for the fee
                    Transaction.objects.create(
                        wallet=wallet,
                        amount=-platform_fee,
                        status="success",
                        result_code=0,
                        result_desc=f"Platform Fee for Ride #{ride.id}",
                        completed_at=timezone.now(),
                        ride=ride
                    )

                    # Notification
                    Notification.objects.create(
                        user=user,
                        title="Ride Posted Successfully",
                        message=f"Your ride to {ride.destination} is now available. Platform fee of KES {platform_fee} has been deducted from your wallet.",
                        notification_type="success"
                    )

                    # Invalidate cache
                    cache.delete_pattern("rides_list_*")
                    
                    return Response(serializer.data, status=status.HTTP_201_CREATED)

                elif payment_method == 'mpesa':
                    # Create the ride with status 'pending_payment'
                    serializer = self.get_serializer(data=request.data)
                    serializer.is_valid(raise_exception=True)
                    ride = serializer.save(driver=user, status='pending_payment', platform_fee=platform_fee)

                    # Initiate STK Push
                    # Try to get phone from request data (form), fallback to user profile
                    phone = request.data.get('phone_number') or user.phone_number
                    
                    if not phone:
                        return Response({"error": "Phone number required for M-Pesa payment"}, status=status.HTTP_400_BAD_REQUEST)

                    phone_clean = str(phone).strip().replace('+', '')
                    if phone_clean.startswith('0'): phone_clean = '254' + phone_clean[1:]
                    elif not phone_clean.startswith('254'): phone_clean = '254' + phone_clean

                    stk_response = lipa_na_mpesa(
                        phone_number=phone_clean,
                        amount=platform_fee,
                        account_reference=phone_clean[:12],
                        transaction_desc=f"Fee-Ride-{ride.id}"[:13]
                    )

                    if "error" in stk_response:
                        ride.delete()
                        return Response({"error": f"M-Pesa initiation failed: {stk_response.get('error')}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                    # Create pending transaction
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    Transaction.objects.create(
                        wallet=wallet,
                        amount=platform_fee,
                        status="pending",
                        checkout_request_id=stk_response.get('CheckoutRequestID'),
                        merchant_request_id=stk_response.get('MerchantRequestID'),
                        mpesa_transaction_reference=stk_response.get('CheckoutRequestID'),
                        ride=ride
                    )

                    return Response({
                        "success": True,
                        "message": "Please confirm the M-Pesa payment on your phone to activate your ride.",
                        "checkout_request_id": stk_response.get('CheckoutRequestID'),
                        "ride_id": ride.id,
                        "status": "pending_payment"
                    }, status=status.HTTP_201_CREATED)

                else:
                    return Response({"error": "Invalid payment method"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating ride with fee: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.save(driver=self.request.user)
        # Invalidate cache when new ride is created
        cache.delete_pattern("rides_list_*")

    def list(self, request, *args, **kwargs):
        # Only cache for passengers (who see all rides)
        if request.user.user_type == 'driver':
            return super().list(request, *args, **kwargs)
        
        # Create a cache key based on query params
        # Use a shared key for all passengers for the same query
        cache_key = f"rides_list_passenger_{request.query_params.urlencode()}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60*5) # Cache for 5 minutes
        return response

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        queryset = Ride.objects.select_related('driver', 'driver__driver_profile').prefetch_related('images')
        
        if user.is_anonymous or user.user_type == 'passenger':
            # Passengers only see future, available rides
            return queryset.filter(departure_time__gte=now, status='available')
        
        if user.user_type == 'driver':
            queryset = queryset.filter(driver=user)
            category = self.request.query_params.get('category')
            
            from django.db.models import Count
            if category == 'active':
                return queryset.filter(departure_time__gte=now).exclude(status='completed')
            elif category == 'completed':
                return queryset.filter(status='completed')
            elif category == 'past':
                # Departed rides (not marked completed) with at least one booking
                return queryset.annotate(booking_count=Count('bookings')).filter(
                    departure_time__lt=now, 
                    booking_count__gt=0
                ).exclude(status='completed')
            elif category == 'expired':
                # Departed rides with no bookings
                return queryset.annotate(booking_count=Count('bookings')).filter(
                    departure_time__lt=now, 
                    booking_count=0
                ).exclude(status='completed')
            # Default for drivers is to see all their rides
            return queryset
            
        # If user has no valid type, return empty for safety
        return Ride.objects.none()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def book(self, request, pk=None):
        """
        Book a ride with payment
        """
        ride = self.get_object()
        payment_method = request.data.get('payment_method')
        try:
            no_of_seats = int(request.data.get('no_of_seats', 1))
        except (ValueError, TypeError):
            no_of_seats = 1
        
        # Validate payment method
        if payment_method not in ['wallet', 'mpesa', 'card']:
            return Response({
                'error': 'Invalid payment method. Must be wallet, mpesa, or card'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate seats availability
        if ride.available_seats < no_of_seats:
            return Response({
                'error': f'Only {ride.available_seats} seat(s) available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent driver from booking their own ride
        if ride.driver == request.user:
            return Response({
                'error': 'You cannot book your own ride'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create booking with transaction
        try:
            with db_transaction.atomic():
                # Create booking
                booking = Booking.objects.create(
                    ride=ride,
                    user=request.user,
                    no_of_seats=no_of_seats,
                    status='pending'
                )
                
                message = ""
                extra_data = {}

                # Handle payment method
                if payment_method == 'wallet':
                    # Reduce seats immediately for wallet payment
                    booking.reduce_seats()
                    
                    # Process wallet payment immediately
                    try:
                        wallet = Wallet.objects.select_for_update().get(user=request.user)
                    except Wallet.DoesNotExist:
                        raise ValueError("Wallet not found. Please create a wallet first.")
                    
                    subtotal = ride.price * no_of_seats
                    platform_fee = subtotal * Decimal('0.05')
                    total_amount = subtotal + platform_fee
                    
                    if wallet.balance < total_amount:
                        raise ValueError(f"Insufficient wallet balance. Required: KSh {total_amount:.2f} (includes 1% fee), Available: KSh {wallet.balance:.2f}")
                    
                    # Deduct from wallet
                    wallet.balance -= total_amount
                    wallet.save()
                    
                    # Mark as paid and confirmed
                    booking.is_paid = True
                    booking.status = 'confirmed'
                    booking.save(update_fields=['is_paid', 'status'])

                    # Create a Transaction record for the wallet deduction
                    Transaction.objects.create(
                        wallet=wallet,
                        amount=-total_amount,
                        status="success",
                        result_code=0,
                        result_desc=f"Ride Payment for Booking #{booking.id}",
                        completed_at=timezone.now(),
                        booking=booking
                    )
                    
                    # Notification for wallet payment success
                    Notification.objects.create(
                        user=request.user,
                        title="Ride Booking Confirmed",
                        message=f"Your booking for ride from {ride.departure_location} to {ride.destination} has been confirmed. KES {total_amount} deducted from your wallet balance.",
                        notification_type="success"
                    )

                    # Notification for driver
                    Notification.objects.create(
                        user=ride.driver,
                        title="New Confirmed Booking (Wallet)",
                        message=f"A booking for your ride to {ride.destination} has been paid via wallet and confirmed.",
                        notification_type="success"
                    )
                    
                    # Send confirmation email
                    from .utils import send_booking_confirmation_email
                    send_booking_confirmation_email(booking)
                    
                    message = 'Booking confirmed successfully'
                    extra_data = {'driver_phone': ride.driver.phone_number}

                elif payment_method in ['mpesa', 'card']:
                    # Payment will be confirmed via callback/webhook
                    # Booking stays in pending status but seats are already reserved
                    message = 'Booking created. Awaiting payment confirmation.'
                    extra_data = {'status': 'pending_payment'}
                    
                    # Notification for driver about new pending booking
                    Notification.objects.create(
                        user=ride.driver,
                        title="New Booking Request",
                        message=f"{request.user.username} has requested {no_of_seats} seat(s) for your ride to {ride.destination}. Awaiting payment.",
                        notification_type="info"
                    )
                
                # Refresh ride to get updated available_seats for the response
                ride.refresh_from_db()
                
                # Invalidate cache since available_seats has changed
                cache.delete_pattern("rides_list_passenger_*")

                return Response({
                    'success': True,
                    'booking_id': booking.id,
                    'message': message,
                    'ride_details': {
                        'departure_location': ride.departure_location,
                        'destination': ride.destination,
                        'departure_time': ride.departure_time,
                        'available_seats': ride.available_seats
                    },
                    **extra_data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'Booking failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        """
        Mark ride as completed
        """
        ride = self.get_object()
        if ride.driver != request.user:
            return Response({"error": "Only the driver can mark a ride as completed"}, status=status.HTTP_403_FORBIDDEN)
        
        if ride.status == 'completed':
            return Response({"error": "Ride is already completed"}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            ride.status = 'completed'
            ride.save()
            
            # Also mark all confirmed bookings as completed
            confirmed_bookings = ride.bookings.filter(status='confirmed')
            confirmed_bookings.update(status='completed')
            
            # Notify passengers
            for booking in confirmed_bookings:
                Notification.objects.create(
                    user=booking.user,
                    title="Ride Completed",
                    message=f"Your ride from {ride.departure_location} to {ride.destination} has been marked as completed. Please leave a review for your driver!",
                    notification_type="success"
                )

        return Response({"success": True, "message": "Ride and all bookings marked as completed"})
    

class IsBookingOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsPaymentOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.booking.user == request.user



class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'is_paid', 'ride']
    search_fields = ['ride__departure_location', 'ride__destination', 'ride__driver__username']
    ordering_fields = ['booked_at', 'updated_at']
    ordering = ['-booked_at']

    def get_queryset(self):
        # Allow both the Passenger AND the Driver to see the booking
        user = self.request.user
        return Booking.objects.select_related(
            'user', 'ride', 'ride__driver', 'ride__driver__driver_profile'
        ).prefetch_related(
            'ride__images'
        ).filter(
            Q(user=user) | Q(ride__driver=user)
        ).distinct()

    @action(detail=False, methods=['get'], url_path='my-bookings')
    def my_bookings(self, request):
        return self.list(request)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        
        if booking.user != request.user:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if booking.status == 'cancelled':
            return Response(
                {"detail": "Booking is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.cancel_booking(reason="Cancelled by user")
        return Response(
            {"detail": "Booking cancelled successfully"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        
        if booking.ride.driver != request.user:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if booking.status != 'pending':
            return Response(
                {"detail": f"Booking is already {booking.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.confirm_booking()
        return Response(
            {"detail": "Booking confirmed successfully"},
            status=status.HTTP_200_OK
        )


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['booking', 'reviewer', 'reviewee']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        # Users can see all reviews related to them (given or received)
        user = self.request.user
        return Review.objects.filter(Q(reviewer=user) | Q(reviewee=user))

    def perform_create(self, serializer):
        booking_id = self.request.data.get('booking')
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"booking": f"Booking with id {booking_id} does not exist."})
        
        # Determine reviewee
        if booking.user == self.request.user:
            # Reviewer is passenger, reviewee is driver
            reviewee = booking.ride.driver
        else:
            # Reviewer is driver, reviewee is passenger
            reviewee = booking.user
            
        serializer.save(reviewer=self.request.user, reviewee=reviewee)
        
        # Notify reviewee
        Notification.objects.create(
            user=reviewee,
            title="New Review Received",
            message=f"You have received a new {serializer.validated_data['rating']}-star review for your ride from {booking.ride.departure_location}.",
            notification_type="info"
        )
