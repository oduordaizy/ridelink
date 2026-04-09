from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from payments.models import Wallet, Transaction
from rides.models import Ride

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
