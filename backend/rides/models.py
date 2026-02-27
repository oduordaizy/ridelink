# rides/models.py
from django.db import models
from accounts.models import User, Notification
from django.utils import timezone
from django.db import transaction as db_transaction

class Ride(models.Model):
    departure_location = models.CharField(max_length=100, db_index=True)
    destination = models.CharField(max_length=100, db_index=True)
    departure_time = models.DateTimeField(db_index=True)
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='driven_rides')
    available_seats = models.IntegerField(null=False, default=1)
    additional_info = models.TextField(blank=True, null=True)
    # vehicle_image removed in favor of RideImage model
    platform_fee = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('fully_booked', 'Fully Booked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', db_index=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.departure_location} to {self.destination} at {self.departure_time}"

    def save(self, *args, **kwargs):
        if self.available_seats == 0 and self.status != 'fully_booked':
            self.status = 'fully_booked'
        super().save(*args, **kwargs)


class RideImage(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='ride_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.ride}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    no_of_seats = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    booked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_paid = models.BooleanField(default=False, db_index=True)
    seats_deducted = models.BooleanField(default=False, db_index=True)

    def __str__(self):
        return f"{self.user.username} booking on {self.ride} - {self.status}"

    def reduce_seats(self):
        """Reduces available seats for the ride when booking is confirmed/paid"""
        if self.seats_deducted:
            return

        with db_transaction.atomic():
            # Refetch ride with lock to ensure seat availability hasn't changed
            ride = Ride.objects.select_for_update().get(id=self.ride_id)
            
            if self.no_of_seats > ride.available_seats:
                raise ValueError("Not enough available seats.")
            
            ride.available_seats -= self.no_of_seats
            
            if ride.available_seats <= 0:
                ride.status = 'fully_booked'
            ride.save()

            self.seats_deducted = True
            self.save(update_fields=['seats_deducted'])

    def restore_seats(self):
        """Restores available seats for the ride when booking is cancelled"""
        if not self.seats_deducted:
            return

        with db_transaction.atomic():
            # Refetch ride with lock
            ride = Ride.objects.select_for_update().get(id=self.ride_id)
            ride.available_seats += self.no_of_seats
            
            if ride.available_seats > 0 and ride.status == 'fully_booked':
                ride.status = 'available'
            ride.save()

            self.seats_deducted = False
            self.save(update_fields=['seats_deducted'])

    def confirm_booking(self):
        """Manually confirm a booking (by driver) and reduce seats"""
        if self.status != 'pending':
            raise ValueError(f"Cannot confirm booking in {self.status} status.")
        
        self.reduce_seats()
        self.status = 'confirmed'
        self.save(update_fields=['status'])
        
        # Send confirmation email
        from .utils import send_booking_confirmation_email
        send_booking_confirmation_email(self)

    def confirm_payment(self):
        """Confirm payment and reduce seats"""
        if self.is_paid:
            return

        self.reduce_seats()
        self.is_paid = True
        self.status = 'confirmed'
        self.save(update_fields=['is_paid', 'status'])
        
        # Send confirmation email
        from .utils import send_booking_confirmation_email
        send_booking_confirmation_email(self)

    def cancel_booking(self, reason=None):
        """Cancel the booking and restore seats if they were deducted"""
        if self.status == 'cancelled':
            return

        if self.seats_deducted:
            self.restore_seats()

        self.status = 'cancelled'
        self.save(update_fields=['status'])

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # Send notification to driver about new booking
            from .utils import send_new_booking_notification_to_driver
            send_new_booking_notification_to_driver(self)