# rides/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Ride, Booking
from accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RideListSerializer(serializers.ModelSerializer):
    driver = serializers.StringRelatedField()
    available_seats = serializers.IntegerField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at', 'driver']

    def get_is_available(self, obj):
        return obj.available_seats > 0 and obj.status == 'available'


class RideDetailSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    available_seats = serializers.IntegerField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at', 'driver']

    def validate_departure_time(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Departure time must be in the future")
        return value

    def validate(self, data):
        if 'arrival_time' in data and 'departure_time' in data:
            if data['arrival_time'] <= data['departure_time']:
                raise serializers.ValidationError("Arrival time must be after departure time")
        return data


class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    ride = serializers.PrimaryKeyRelatedField(queryset=Ride.objects.all())
    ride_details = RideListSerializer(source='ride', read_only=True)
    status = serializers.CharField(read_only=True)
    is_paid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'ride', 'ride_details', 'user', 'seats_booked', 'status',
            'is_paid', 'booked_at', 'updated_at', 'cancellation_reason'
        ]
        read_only_fields = ['booked_at', 'updated_at']

    def validate_seats_booked(self, value):
        if value < 1:
            raise serializers.ValidationError("At least one seat must be booked")
        return value

    def validate(self, data):
        ride = data.get('ride') or self.instance.ride if self.instance else None
        seats_booked = data.get('seats_booked')
        
        if not ride:
            raise serializers.ValidationError({"ride": "Ride is required"})
            
        if ride.status != 'available':
            raise serializers.ValidationError({"ride": "This ride is not available for booking"})
            
        if seats_booked and seats_booked > ride.available_seats:
            raise serializers.ValidationError(
                {"seats_booked": f"Only {ride.available_seats} seats available"}
            )
            
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        booking = Booking.objects.create(user=user, **validated_data)
        return booking


# class PaymentSerializer(serializers.ModelSerializer):
#     booking = BookingSerializer(read_only=True)
#     booking_id = serializers.PrimaryKeyRelatedField(
#         queryset=Booking.objects.filter(is_paid=False),
#         source='booking',
#         write_only=True
#     )
#     is_successful = serializers.BooleanField(read_only=True)
#     refund_status = serializers.CharField(read_only=True)

#     class Meta:
#         model = Payment
#         fields = [
#             'id', 'booking', 'booking_id', 'amount', 'payment_method',
#             'transaction_id', 'timestamp', 'is_successful',
#             'refund_status', 'refund_amount', 'refund_reason'
#         ]
#         read_only_fields = ['timestamp', 'is_successful', 'refund_status']

#     def validate(self, data):
#         booking = data.get('booking')
#         amount = data.get('amount')
        
#         if booking.is_paid:
#             raise serializers.ValidationError({"booking": "This booking has already been paid for"})
            
#         if amount < (booking.ride.price * booking.seats_booked):
#             raise serializers.ValidationError(
#                 {"amount": f"Amount must be at least {booking.ride.price * booking.seats_booked}"}
#             )
            
#         return data

#     def create(self, validated_data):
#         payment = Payment.objects.create(**validated_data)
        
#         try:
#             # Here you would integrate with your payment gateway
#             # For now, we'll simulate a successful payment
#             payment.is_successful = True
#             payment.transaction_id = f"txn_{payment.id}_{timezone.now().timestamp()}"
#             payment.save()
            
#             # Confirm the booking
#             booking = payment.booking
#             booking.confirm_payment()
            
#             return payment
#         except Exception as e:
#             payment.is_successful = False
#             payment.save()
#             raise serializers.ValidationError({"payment": str(e)})