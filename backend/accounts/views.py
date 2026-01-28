from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
from .models import User
from rest_framework import generics, status, permissions
from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.parsers import MultiPartParser, FormParser
import requests


# Create your views here.

def home(request):
    return JsonResponse({'message': "Welcome to Travas"})

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Handles file uploads

    def get_object(self):
        return self.request.user

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        # Return the current user's profile
        return self.request.user
    
    def get_serializer_context(self):
        # Add request to serializer context for URL building if needed
        return {'request': self.request}
    
    def retrieve(self, request, *args, **kwargs):
        # Custom retrieve to include driver profile data
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        # Handle partial updates (PATCH)
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        # Create a mutable copy of the request data
        data = request.data.copy()
        
        # Map driver profile fields to the correct nested structure
        driver_fields = ['license_number', 'vehicle_model', 'vehicle_color', 'vehicle_plate']
        driver_data = {}
        
        for field in driver_fields:
            if field in data:
                driver_data[field] = data.pop(field, None)
        
        if driver_data:
            data['driver_profile'] = driver_data
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Get the updated instance
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        # Save the serializer and update the user instance
        serializer.save()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"message": "Error logging out"}, status=status.HTTP_400_BAD_REQUEST)



from .utils import generate_otp, send_otp_email
from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
    otp = generate_otp()
    user.otp = otp
    user.otp_created_at = timezone.now()
    user.save()
    
    if send_otp_email(user, otp):
        return Response({'message': 'OTP sent successfully'})
    else:
        return Response({'error': 'Failed to send OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if user.otp != otp:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check expiration (e.g., 10 minutes)
    if user.otp_created_at and timezone.now() > user.otp_created_at + timedelta(minutes=10):
        return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.is_verified = True
    user.otp = None # Clear OTP after successful verification
    user.save()
    
    refresh = RefreshToken.for_user(user)
        
    return Response({
        'message': 'Email verified successfully',
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserProfileSerializer(user).data
    })
 
class SwitchRoleView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        from .models import Driver, Passenger
        
        # Determine target role
        new_role = 'driver' if user.user_type == 'passenger' else 'passenger'
        
        # Update role
        user.user_type = new_role
        user.save(update_fields=['user_type'])
        
        # Ensure profiles exist
        if new_role == 'driver' and not hasattr(user, 'driver_profile'):
            Driver.objects.get_or_create(user=user)
        elif new_role == 'passenger' and not hasattr(user, 'passenger_profile'):
            Passenger.objects.get_or_create(user=user)
            
        serializer = self.get_serializer(user)
        return Response({
            'message': f'Successfully switched to {new_role} mode',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
