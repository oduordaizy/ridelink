from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('driver', 'Driver'),
        ('passenger', 'Passenger'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True, validators=[
        RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    ])
    profile_picture = models.ImageField(upload_to='profile_pictures/', default='profile_pictures/default-profile.png', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_profile_complete(self):
        # Base check for all users (e.g., profile picture)
        if not self.profile_picture or 'default-profile.png' in self.profile_picture.name:
            return False
            
        if self.user_type == 'driver':
            try:
                return self.driver_profile.is_complete
            except Driver.DoesNotExist:
                return False
        
        # Passengers are always "complete" for now
        return True

    class Meta:
        db_table = 'users'

class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    vehicle_model = models.CharField(max_length=100, blank=True, null=True)
    vehicle_color = models.CharField(max_length=50, blank=True, null=True)
    vehicle_plate = models.CharField(max_length=20, blank=True, null=True)
    vehicle_picture = models.ImageField(upload_to='vehicle_pictures/', blank=True, null=True)
    # is_available = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
    @property
    def is_complete(self):
        required_fields = [
            self.license_number, 
            self.vehicle_model, 
            self.vehicle_color, 
            self.vehicle_plate
        ]
        return all(field and str(field).strip() != '' for field in required_fields)

    class Meta:
        db_table = 'driver_profiles'

class Passenger(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passenger_profile')
    emergency_contact = models.CharField(max_length=15, blank=True)
    preferred_payment_method = models.CharField(max_length=50, default='wallet')
    
    
    class Meta:
        db_table = 'passenger_profiles'