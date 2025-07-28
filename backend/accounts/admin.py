from django.contrib import admin
from .models import User, Driver, Passenger

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'phone_number')

@admin.register(Driver)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'vehicle_model', 'vehicle_color', 'vehicle_plate', 'rating')

@admin.register(Passenger)
class PassengerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'emergency_contact', 'preferred_payment_method')
