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
