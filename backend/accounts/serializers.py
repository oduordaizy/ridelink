from rest_framework import serializers
from .models import User, Driver, Passenger
from django.contrib.auth import authenticate


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirmation', 'user_type', 'phone_number']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError("Passwords do not match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirmation') #remove password_confirmation from validated_data
        user = User.objects.create_user(**validated_data)

        #create a profile based on user type
        if user.user_type == 'driver':
            Driver.objects.create(user=user)
        elif user.user_type == 'passenger':
            Passenger.objects.create(user=user)
        return user
    
class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            if not user.is_active:
                raise serializers.ValidationError("User is not active")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'")
        
        attrs['user'] = user
        return attrs
    
    
class UserProfileSerializer(serializers.ModelSerializer):
    driver_profile = serializers.SerializerMethodField()
    passenger_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'user_type', 'driver_profile', 'passenger_profile']
        read_only_fields = ['id']

    def get_driver_profile(self, obj):
        if hasattr(obj, 'driver_profile'):
            return {
                'license_number': obj.driver_profile.license_number,
                # 'license_expiry_date': obj.driver_profile.license_expiry_date,
                'vehicle_type': obj.driver_profile.vehicle_type,
                'vehicle_number': obj.driver_profile.vehicle_number,
                'vehicle_model': obj.driver_profile.vehicle_model,
                'vehicle_color': obj.driver_profile.vehicle_color,
                # 'vehicle_image': obj.driver_profile.vehicle_image.url if obj.driver_profile.vehicle_image else None,
                'rating': obj.driver_profile.rating,
            }
        return None


    def get_passenger_profile(self, obj):
        if hasattr(obj, 'passenger_profile'):
            return {
                'emergency_contact': obj.passenger_profile.emergency_contact,
                'preferred_payment_method': obj.passenger_profile.preferred_payment_method,
            }
        return None
        
        