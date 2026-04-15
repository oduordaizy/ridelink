from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from payments.models import Wallet, Transaction
from rides.models import Ride, Booking

User = get_user_model()


class RideBookingWalletPaymentTest(TestCase):
    def setUp(self):
        self.driver = User.objects.create_user(username='driver', password='pass', user_type='driver')
        self.passenger = User.objects.create_user(username='passenger', password='pass')
        self.driver_wallet = Wallet.objects.create(user=self.driver, balance=Decimal('0.00'))
        self.passenger_wallet = Wallet.objects.create(user=self.passenger, balance=Decimal('200.00'))
        self.ride = Ride.objects.create(
            departure_location='Nairobi',
            destination='Mombasa',
            departure_time=timezone.now() + timedelta(days=1),
            driver=self.driver,
            available_seats=2,
            price=Decimal('100.00')
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.passenger)

    def test_wallet_booking_credits_driver_wallet(self):
        response = self.client.post(
            f'/api/rides/{self.ride.id}/book/',
            {'no_of_seats': 1, 'payment_method': 'wallet'},
            format='json'
        )
        self.assertEqual(response.status_code, 200)

        self.driver_wallet.refresh_from_db()
        self.assertEqual(self.driver_wallet.balance, Decimal('100.00'))

        self.assertTrue(
            Transaction.objects.filter(
                wallet=self.driver_wallet,
                transaction_type='earning',
                amount=Decimal('100.00')
            ).exists()
        )


class BookingDeletionTest(TestCase):
    def setUp(self):
        self.driver = User.objects.create_user(username='driver2', password='pass', user_type='driver')
        self.passenger = User.objects.create_user(username='passenger2', password='pass')
        self.other_user = User.objects.create_user(username='otheruser', password='pass')
        self.ride = Ride.objects.create(
            departure_location='Nairobi',
            destination='Kisumu',
            departure_time=timezone.now() + timedelta(days=1),
            driver=self.driver,
            available_seats=3,
            price=Decimal('150.00')
        )
        self.client = APIClient()

    def test_passenger_can_delete_cancelled_booking(self):
        booking = Booking.objects.create(
            ride=self.ride,
            user=self.passenger,
            no_of_seats=1,
            status='cancelled'
        )
        self.client.force_authenticate(user=self.passenger)

        response = self.client.delete(f'/api/bookings/{booking.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Booking.objects.filter(id=booking.id).exists())

    def test_passenger_cannot_delete_non_cancelled_booking(self):
        booking = Booking.objects.create(
            ride=self.ride,
            user=self.passenger,
            no_of_seats=1,
            status='pending'
        )
        self.client.force_authenticate(user=self.passenger)

        response = self.client.delete(f'/api/bookings/{booking.id}/')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(Booking.objects.filter(id=booking.id).exists())

    def test_non_owner_cannot_delete_cancelled_booking(self):
        booking = Booking.objects.create(
            ride=self.ride,
            user=self.passenger,
            no_of_seats=1,
            status='cancelled'
        )
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(f'/api/bookings/{booking.id}/')

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Booking.objects.filter(id=booking.id).exists())


class RideDeletionPermissionTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='rideowner', password='pass', user_type='driver')
        self.other_user = User.objects.create_user(username='otherdriver', password='pass', user_type='driver')
        self.ride = Ride.objects.create(
            departure_location='Nairobi',
            destination='Naivasha',
            departure_time=timezone.now() + timedelta(days=1),
            driver=self.owner,
            available_seats=2,
            price=Decimal('300.00')
        )
        self.client = APIClient()

    def test_owner_can_delete_ride_after_switching_to_passenger(self):
        self.owner.user_type = 'passenger'
        self.owner.save(update_fields=['user_type'])
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(f'/api/rides/{self.ride.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Ride.objects.filter(id=self.ride.id).exists())

    def test_non_owner_cannot_delete_ride(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(f'/api/rides/{self.ride.id}/')

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Ride.objects.filter(id=self.ride.id).exists())
