from django.test import TestCase
from django.utils import timezone
from decimal import Decimal

from payments.views import process_stk_result
from payments.models import Transaction, Wallet
from django.contrib.auth import get_user_model


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
        result = process_stk_result(self.tx, '0', 'Success', callback_metadata={'Item': []})
        self.tx.refresh_from_db()
        self.assertTrue(result)
        self.assertEqual(self.tx.status, 'success')
        self.assertIsNotNone(self.tx.completed_at)
        self.assertEqual(self.wallet.refresh_from_db() or self.wallet.balance, Decimal('100'))

    def test_failure_updates_transaction(self):
        result = process_stk_result(self.tx, '2', 'User cancelled')
        self.tx.refresh_from_db()
        self.assertTrue(result)
        self.assertEqual(self.tx.status, 'failed')
        self.assertEqual(self.tx.result_desc, 'User cancelled')
