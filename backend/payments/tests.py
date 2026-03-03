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
