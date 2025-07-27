from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('driver', 'Driver'),
        ('passenger', 'Passenger'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='passenger')
    phone_number = models.CharField(max_length=15, unique=True, validators=[RegexValidator(r'^\+?1?\d{9,15}$')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=20, unique=True)
    # license_expiry_date = models.DateField()
    vehicle_type = models.CharField(max_length=20)
    vehicle_number = models.CharField(max_length=20)
    vehicle_model = models.CharField(max_length=20)
    vehicle_color = models.CharField(max_length=20)
    # vehicle_image = models.ImageField(upload_to='vehicle_images/', null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    

    class Meta:
        db_table = 'drivers'

class Passenger(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passenger_profile')
    emergency_contact = models.CharField(max_length=15, validators=[RegexValidator(r'^\+?1?\d{9,15}$')])
    preferred_payment_method = models.CharField(max_length=20, default='Mpesa')

    class Meta:
        db_table = 'passengers'