# rides/views.py
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import OrderingFilter
from django_filters import rest_framework as django_filters
from django.db.models import Q
from django.utils import timezone

from .models import Ride, Booking
from .serializers import (
    RideListSerializer, RideDetailSerializer,
    BookingSerializer, 
)


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

    def get_queryset(self):
        # Drivers only see their own rides; passengers see all
        user = self.request.user
        if user.user_type == 'driver':
            return Ride.objects.filter(driver=user)
        return Ride.objects.all()
    

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


# class RideViewSet(viewsets.ModelViewSet):
#     queryset = Ride.objects.all()
#     permission_classes = [permissions.IsAuthenticated]
#     filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
#     filterset_class = RideFilter
#     ordering_fields = ['departure_time', 'price', 'available_seats']
#     ordering = ['departure_time']

#     def get_serializer_class(self):
#         if self.action == 'retrieve':
#             return RideDetailSerializer
#         return RideListSerializer

#     def get_queryset(self):
#         queryset = super().get_queryset()
        
#         # Filter out past rides by default
#         if self.request.query_params.get('include_past', '').lower() != 'true':
#             queryset = queryset.filter(departure_time__gte=timezone.now())
            
#         # For list view, only show available rides
#         if self.action == 'list':
#             queryset = queryset.filter(status='available')
            
#         return queryset

#     def perform_create(self, serializer):
#         serializer.save(driver=self.request.user)

#     @action(detail=True, methods=['post'])
#     def cancel(self, request, pk=None):
#         ride = self.get_object()
#         if ride.driver != request.user:
#             return Response(
#                 {"detail": "You do not have permission to perform this action."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
            
#         if ride.status == 'cancelled':
#             return Response(
#                 {"detail": "Ride is already cancelled"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
            
#         ride.status = 'cancelled'
#         ride.save()
        
#         # Cancel all bookings
#         for booking in ride.bookings.all():
#             booking.cancel_booking(reason="Ride was cancelled by driver")
            
#         return Response(
#             {"detail": "Ride cancelled successfully"},
#             status=status.HTTP_200_OK
#         )


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'is_paid', 'ride']
    ordering_fields = ['booked_at', 'updated_at']
    ordering = ['-booked_at']

    def get_queryset(self):
        # Users can only see their own bookings
        return Booking.objects.filter(user=self.request.user)

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


# class PaymentViewSet(viewsets.ModelViewSet):
#     serializer_class = PaymentSerializer
#     permission_classes = [permissions.IsAuthenticated, IsPaymentOwner]
    
#     def get_queryset(self):
#         # Users can only see their own payments
#         return Payment.objects.filter(booking__user=self.request.user)

#     @action(detail=True, methods=['post'])
#     def refund(self, request, pk=None):
#         payment = self.get_object()
        
#         if payment.booking.user != request.user:
#             return Response(
#                 {"detail": "You do not have permission to perform this action."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
            
#         try:
#             amount = request.data.get('amount')
#             reason = request.data.get('reason')
            
#             payment.process_refund(amount, reason)
#             return Response(
#                 {"detail": "Refund processed successfully"},
#                 status=status.HTTP_200_OK
#             )
#         except ValueError as e:
#             return Response(
#                 {"detail": str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except Exception as e:
#             return Response(
#                 {"detail": "An error occurred while processing the refund"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )