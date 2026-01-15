# rides/views.py
from rest_framework import viewsets, status, permissions, filters
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

from .models import Ride, Booking
from .serializers import (
    RideListSerializer, RideDetailSerializer,
    BookingSerializer, 
)
from payments.models import Wallet


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

    def perform_create(self, serializer):
        serializer.save(driver=self.request.user)
        # Invalidate cache when new ride is created
        cache.delete_pattern("rides_list_*")

    def list(self, request, *args, **kwargs):
        # Only cache for passengers (who see all rides)
        if request.user.user_type == 'driver':
            return super().list(request, *args, **kwargs)
        
        # Create a cache key based on query params
        cache_key = f"rides_list_{request.user.id}_{request.query_params.urlencode()}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60*5) # Cache for 5 minutes
        return response

    def get_queryset(self):
        # Drivers only see their own rides; passengers see all
        user = self.request.user
        queryset = Ride.objects.select_related('driver', 'driver__driver_profile').prefetch_related('images')
        
        if user.user_type == 'driver':
            return queryset.filter(driver=user)
        return queryset
    
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
        
        # Check if user already has a booking for this ride
        existing_booking = Booking.objects.filter(
            ride=ride,
            user=request.user,
            status__in=['pending', 'confirmed']
        ).first()
        
        if existing_booking:
            return Response({
                'error': 'You already have a booking for this ride'
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
                
                # Handle payment method
                if payment_method == 'wallet':
                    # Process wallet payment immediately
                    try:
                        wallet = Wallet.objects.select_for_update().get(user=request.user)
                    except Wallet.DoesNotExist:
                        booking.delete()
                        return Response({
                            'error': 'Wallet not found. Please create a wallet first.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    total_amount = ride.price * no_of_seats
                    
                    if wallet.balance < total_amount:
                        booking.delete()
                        return Response({
                            'error': f'Insufficient wallet balance. Required: KSh {total_amount:.2f}, Available: KSh {wallet.balance:.2f}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Deduct from wallet
                    wallet.balance -= total_amount
                    wallet.save()
                    
                    # Confirm booking and reduce seats
                    booking.confirm_payment()
                    
                    return Response({
                        'success': True,
                        'booking_id': booking.id,
                        'message': 'Booking confirmed successfully',
                        'driver_phone': ride.driver.phone_number,
                        'ride_details': {
                            'departure_location': ride.departure_location,
                            'destination': ride.destination,
                            'departure_time': ride.departure_time,
                            'available_seats': ride.available_seats
                        }
                    }, status=status.HTTP_201_CREATED)
                
                elif payment_method in ['mpesa', 'card']:
                    # Payment will be confirmed via callback/webhook
                    # Booking stays in pending status
                    return Response({
                        'success': True,
                        'booking_id': booking.id,
                        'message': 'Booking created. Awaiting payment confirmation.',
                        'status': 'pending_payment'
                    }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'Booking failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class IsBookingOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsPaymentOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.booking.user == request.user


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
            'min_seats', 'date_after', 'date_before', 'status'
        ]

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'is_paid', 'ride']
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
