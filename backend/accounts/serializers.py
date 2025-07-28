from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Driver, Passenger

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone_number', 'user_type']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        # Create profile based on user type
        if user.user_type == 'driver':
            Driver.objects.create(user=user)
        else:
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
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
        else:
            raise serializers.ValidationError('Must include username and password')
        
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
        if hasattr(obj, 'driver'):
            return {
                'license_number': obj.driver.license_number,
                'vehicle_model': obj.driver.vehicle_model,
                'vehicle_color': obj.driver.vehicle_color,
                'vehicle_plate': obj.driver.vehicle_plate,
                'rating': obj.driver.rating,
                
            }
        return None
    
    def get_passenger_profile(self, obj):
        if hasattr(obj, 'passenger'):
            return {
                'emergency_contact': obj.passenger.emergency_contact,
                'preferred_payment_method': obj.passenger.preferred_payment_method,
                
            }
        return None
        
        