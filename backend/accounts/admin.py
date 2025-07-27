from django.contrib import admin
from .models import User, Passenger, Driver

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'phone_number')

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('user', 'vehicle_type', 'vehicle_number', 'vehicle_model', 'vehicle_color', 'rating')


@admin.register(Passenger)
class PassengerAdmin(admin.ModelAdmin):
    list_display = ('user', 'emergency_contact', 'preferred_payment_method')
