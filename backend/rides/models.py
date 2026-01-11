# rides/models.py
from django.db import models
from accounts.models import User
from django.utils import timezone

class Ride(models.Model):
    departure_location = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_time = models.DateTimeField()
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='driven_rides')
    available_seats = models.IntegerField(null=False, default=1)
    additional_info = models.TextField(blank=True, null=True)
    platform_fee = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('fully_booked', 'Fully Booked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    
    price = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.departure_location} to {self.destination} at {self.departure_time}"

    def save(self, *args, **kwargs):
        if self.available_seats == 0 and self.status != 'fully_booked':
            self.status = 'fully_booked'
        super().save(*args, **kwargs)


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
    
    ]
    
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    no_of_seats = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    booked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} booking on {self.ride} - {self.status}"

    def confirm_booking(self):
        if self.status != 'pending':
            raise ValueError("No pending seats.")
        self.status = 'confirmed'
        self.save()

    
    def confirm_payment(self):
        if self.is_paid:
            raise ValueError("Already paid.")

        if self.no_of_seats > self.ride.available_seats:
            raise ValueError("Not enough available seats.")
        self.ride.available_seats -= self.no_of_seats
        
        if self.ride.available_seats == 0:
            self.ride.status = 'fully_booked'
        self.ride.save()

        self.is_paid = True
        self.status = 'confirmed'
        self.save()