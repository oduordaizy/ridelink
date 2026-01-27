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
    license_number = serializers.CharField(source='driver_profile.license_number', required=False, allow_blank=True, allow_null=True)
    vehicle_model = serializers.CharField(source='driver_profile.vehicle_model', required=False, allow_blank=True, allow_null=True)
    vehicle_color = serializers.CharField(source='driver_profile.vehicle_color', required=False, allow_blank=True, allow_null=True)
    vehicle_plate = serializers.CharField(source='driver_profile.vehicle_plate', required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'user_type', 'profile_picture', 'license_number', 'vehicle_model',
            'vehicle_color', 'vehicle_plate', 'created_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'user_type', 'created_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add driver profile data to the response
        if hasattr(instance, 'driver_profile'):
            representation.update({
                'license_number': instance.driver_profile.license_number,
                'vehicle_model': instance.driver_profile.vehicle_model,
                'vehicle_color': instance.driver_profile.vehicle_color,
                'vehicle_plate': instance.driver_profile.vehicle_plate,
                'rating': float(instance.driver_profile.rating)
            })
        return representation
    
    def update(self, instance, validated_data):
        # Handle driver profile data if it exists
        driver_data = {}
        if 'driver_profile' in validated_data:
            driver_data = validated_data.pop('driver_profile')
        
        # Update user fields
        user = super().update(instance, validated_data)
        
        # Update or create driver profile if user is a driver
        if hasattr(user, 'driver_profile') and driver_data:
            driver = user.driver_profile
            for key, value in driver_data.items():
                setattr(driver, key, value)
            driver.save()
        
        return user