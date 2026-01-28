# rides/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Ride, Booking, RideImage
from accounts.models import User, Driver


class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['vehicle_model', 'vehicle_color', 'vehicle_plate', 'vehicle_picture', 'rating']


class UserSerializer(serializers.ModelSerializer):
    driver_profile = DriverProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'profile_picture', 'driver_profile']


class RideImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideImage
        fields = ['id', 'image', 'created_at']


class RideListSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)  # Return full driver object
    available_seats = serializers.IntegerField()
    is_available = serializers.SerializerMethodField()
    images = RideImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=True,
        allow_empty=False
    )

    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at', 'driver', 'images']

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        ride = Ride.objects.create(**validated_data)
        
        for image in uploaded_images:
            RideImage.objects.create(ride=ride, image=image)
            
        return ride

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
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'ride', 'ride_details', 'user', 'no_of_seats', 'status',
            'is_paid', 'booked_at', 'updated_at', 'total_price'
        ]
        read_only_fields = ['booked_at', 'updated_at']

    def get_total_price(self, obj):
        return obj.no_of_seats * obj.ride.price

    def validate_no_of_seats(self, value):
        if value < 1:
            raise serializers.ValidationError("At least one seat must be booked")
        return value

    def validate(self, data):
        ride = data.get('ride') or self.instance.ride if self.instance else None
        no_of_seats = data.get('no_of_seats')
        
        if not ride:
            raise serializers.ValidationError({"ride": "Ride is required"})
            
        if ride.status != 'available':
            raise serializers.ValidationError({"ride": "This ride is not available for booking"})
            
        if no_of_seats and no_of_seats > ride.available_seats:
            raise serializers.ValidationError(
                {"no_of_seats": f"Only {ride.available_seats} seats available"}
            )
            
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        booking = Booking.objects.create(user=user, **validated_data)
        return booking
