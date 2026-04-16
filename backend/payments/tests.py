from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from payments.views import process_stk_result
from payments.models import Transaction, Wallet
from django.contrib.auth import get_user_model
from rides.models import Ride, Booking


User = get_user_model()


class STKResultProcessingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass')
        self.wallet = Wallet.objects.create(user=self.user, balance=0)
        self.tx = Transaction.objects.create(
            wallet=self.wallet,
            amount=Decimal('100'),
            status='pending',
            checkout_request_id='ABC123'
        )

    def test_skip_still_processing_numeric_code(self):
        # a result_code of "1" with a processing description should be skipped
        before_status = self.tx.status
        result = process_stk_result(self.tx, '1', 'Transaction is still processing')
        self.tx.refresh_from_db()
        self.assertFalse(result)
        self.assertEqual(self.tx.status, before_status)

    def test_skip_still_processing_error_code(self):
        result = process_stk_result(self.tx, '500.001.1001', "The transaction is being processed")
        self.tx.refresh_from_db()
        self.assertFalse(result)
        self.assertEqual(self.tx.status, 'pending')

    def test_success_updates_transaction(self):
        # simulate a callback with a TransactionID value
        result = process_stk_result(
            self.tx,
            '0',
            'Success',
            callback_metadata={'Item': [{'Name': 'TransactionID', 'Value': 'REF123'}]}
        )
        self.tx.refresh_from_db()
        self.assertTrue(result)
        self.assertEqual(self.tx.status, 'success')
        self.assertIsNotNone(self.tx.completed_at)
        # wallet balance updated
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('100'))
        # reference field populated
        self.assertEqual(self.tx.mpesa_transaction_reference, 'REF123')

    def test_wallet_topup_does_not_auto_confirm_pending_booking(self):
        driver = User.objects.create_user(username='driver_auto', password='pass', user_type='driver')
        ride = Ride.objects.create(
            departure_location='Nairobi',
            destination='Eldoret',
            departure_time=timezone.now() + timedelta(days=1),
            driver=driver,
            available_seats=2,
            price=Decimal('100.00')
        )
        booking = Booking.objects.create(
            ride=ride,
            user=self.user,
            no_of_seats=1,
            status='pending',
            is_paid=False
        )

        result = process_stk_result(
            self.tx,
            '0',
            'Success',
            callback_metadata={'Item': [{'Name': 'TransactionID', 'Value': 'TOPUPREF'}]}
        )

        self.assertTrue(result)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'pending')
        self.assertFalse(booking.is_paid)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('100'))

    def test_list_transactions_api_includes_reference(self):
        from rest_framework.test import APIClient
        client = APIClient()
        # create a successful transaction with a reference
        tx2 = Transaction.objects.create(
            wallet=self.wallet,
            amount=Decimal('50'),
            status='success',
            mpesa_transaction_reference='ABCREF',
            checkout_request_id='XYZ'
        )
        # simulate authenticated user having wallet
        client.force_authenticate(user=self.user)
        response = client.get('/api/payments/wallet/transactions/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # expect at least one transaction with reference field
        self.assertTrue(any(item.get('mpesa_transaction_reference') == 'ABCREF' for item in data.get('data', [])))

    def test_failure_updates_transaction(self):
        result = process_stk_result(self.tx, '2', 'User cancelled')
        self.tx.refresh_from_db()
        self.assertTrue(result)
        self.assertEqual(self.tx.status, 'failed')
        self.assertEqual(self.tx.result_desc, 'User cancelled')


class BookingEarningsTest(TestCase):
    def setUp(self):
        self.driver = User.objects.create_user(username='driver', password='driverpass', user_type='driver')
        self.passenger = User.objects.create_user(username='passenger', password='pass')
        self.driver_wallet = Wallet.objects.create(user=self.driver, balance=Decimal('0.00'))
        self.passenger_wallet = Wallet.objects.create(user=self.passenger, balance=Decimal('0.00'))
        self.ride = Ride.objects.create(
            departure_location='Nairobi',
            destination='Mombasa',
            departure_time=timezone.now() + timedelta(days=1),
            driver=self.driver,
            available_seats=3,
            price=Decimal('100.00')
        )
        self.booking = Booking.objects.create(
            ride=self.ride,
            user=self.passenger,
            no_of_seats=1,
            status='pending'
        )
        self.tx = Transaction.objects.create(
            wallet=self.passenger_wallet,
            amount=Decimal('105.00'),
            status='pending',
            checkout_request_id='BOOKING123',
            booking=self.booking,
            transaction_type='booking'
        )

    def test_booking_payment_credits_driver_wallet(self):
        result = process_stk_result(
            self.tx,
            '0',
            'Success',
            callback_metadata={'Item': [{'Name': 'TransactionID', 'Value': 'REF123'}]}
        )
        self.assertTrue(result)
        self.driver_wallet.refresh_from_db()
        self.assertEqual(self.driver_wallet.balance, Decimal('100.00'))

        driver_tx = Transaction.objects.filter(
            wallet=self.driver_wallet,
            transaction_type='earning',
            booking=self.booking
        ).first()
        self.assertIsNotNone(driver_tx)
        self.assertEqual(driver_tx.amount, Decimal('100.00'))
