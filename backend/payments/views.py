from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction as db_transaction
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal
import json
from .models import Transaction, Wallet
from .mpesa import lipa_na_mpesa, query_stk_status, b2c_payout, normalize_phone_number
from accounts.models import Notification
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def topup_wallet(request):
    try:
        # Get the authenticated user
        user = request.user
        if user.is_anonymous:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Parse JSON data from request
        try:
            data = request.data
            phone_number = data.get("phone")
            amount = data.get("amount")
            booking_id = data.get("booking_id")
        except Exception as e:
            return Response(
                {"error": "Invalid request data"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate inputs
        if not all([phone_number, amount]):
            return Response(
                {"error": "Missing required fields. Both 'phone' and 'amount' are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError, Exception):
            return Response(
                {"error": "Invalid amount. Must be a positive number."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the payment
        with db_transaction.atomic():
            # Get or create wallet for the user
            wallet, created = Wallet.objects.get_or_create(
                user=user,
                defaults={'balance': 0.00}
            )
            
            # Custom reference: iTra-First3phone..last3phone
            # Custom reference: User's phone number as requested
            # NOTE: AccountReference is limited to 12 chars
            phone = str(phone_number).strip().replace('+', '')
            if phone.startswith('0'):
                phone = '254' + phone[1:]
            elif not phone.startswith('254'):
                phone = '254' + phone
            branded_ref = phone[:12]
            
            response = lipa_na_mpesa(
                phone_number=phone,
                amount=amount,
                account_reference=branded_ref, 
                transaction_desc=f"Ride {branded_ref}"[:13]
            )
            
            # Handle MPESA API response
            if "error" in response:
                logger.error(f"M-Pesa STK Push Error for user {user.id}: {response.get('error')}")
                return Response(
                    {"error": f"Payment initiation failed: {response.get('error')}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f"M-Pesa STK Push Success for user {user.id}: CheckoutRequestID={response.get('CheckoutRequestID')}")
            # Create transaction with the IDs from MPESA response
            # record the various ids MPESA returns; we also populate the
            # new 'mpesa_transaction_reference' field with the checkout id for
            # easier lookup/display later (this will be replaced by the actual
            # transaction reference when the callback arrives).
            transaction_type = "booking" if booking_id else "topup"

            transaction_obj = Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                status="pending",
                checkout_request_id=response.get('CheckoutRequestID'),
                merchant_request_id=response.get('MerchantRequestID'),
                mpesa_transaction_reference=response.get('CheckoutRequestID'),
                booking_id=booking_id,
                transaction_type=transaction_type
            )
            
            return Response({
                "success": True,
                "message": "Payment initiated successfully",
                "checkout_request_id": response.get('CheckoutRequestID'),
                "transaction_id": str(transaction_obj.id)
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Topup error: {str(e)}", exc_info=True)
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    """
    API endpoint to get the current wallet balance for the authenticated user
    """
    try:
        wallet, created = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': 0.00}
        )
        
        return Response({
            'success': True,
            'balance': float(wallet.balance),
            'currency': 'KES',
            'user_id': str(request.user.id)
        })
        
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching wallet balance: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def withdraw_wallet(request):
    """
    API endpoint to initiate a withdrawal from wallet to M-Pesa
    """
    user = request.user
    data = request.data
    amount = data.get("amount")
    phone_number = data.get("phone")

    if not all([amount, phone_number]):
        return Response(
            {"error": "Amount and phone number are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        amount = Decimal(str(amount))
        if amount <= 0:
            return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=user)
            
            if wallet.balance < amount:
                return Response(
                    {"error": "Insufficient wallet balance"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Normalize the phone number for MPESA (2547XXXXXXXX)
            try:
                normalized_phone = normalize_phone_number(phone_number)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            # Deduct balance immediately (Pending status)
            wallet.balance -= amount
            wallet.save()

            # Create withdrawal transaction
            transaction_obj = Transaction.objects.create(
                wallet=wallet,
                amount=-amount,
                status="pending",
                transaction_type="withdrawal",
                result_desc=f"Withdrawal to {normalized_phone}"
            )

            # Initiate B2C Payout
            response = b2c_payout(
                phone_number=normalized_phone,
                amount=amount,
                remarks=f"Withdrawal for {user.username}"
            )

            # Safaricom might return 'error' (our custom fail logic), 'errorMessage' (API failure), 
            # or a ResponseCode other than "0" for failures.
            is_error = (
                "error" in response or 
                "errorMessage" in response or 
                (response.get("ResponseCode") and str(response.get("ResponseCode")) != "0")
            )

            if is_error:
                # Rollback balance if initiation fails
                wallet.balance += amount
                wallet.save()
                transaction_obj.status = "failed"
                error_msg = response.get("error") or response.get("errorMessage") or response.get("ResponseDescription") or "Unknown M-Pesa Error"
                transaction_obj.result_desc = error_msg
                transaction_obj.save()
                
                return Response(
                    {"error": f"Withdrawal failed to initiate: {error_msg}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Store ConversationID/OriginID if available (Safaricom B2C returns these)
            transaction_obj.mpesa_transaction_reference = response.get('ConversationID')
            transaction_obj.save()

            return Response({
                "success": True,
                "message": "Withdrawal initiated. You will receive an M-Pesa confirmation soon.",
                "transaction_id": transaction_obj.id
            }, status=status.HTTP_200_OK)

    except Wallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Withdrawal error: {str(e)}", exc_info=True)
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def query_mpesa_status(request):
    """
    API endpoint to query the status of an STK push transaction
    """
    checkout_request_id = request.query_params.get('checkout_request_id')
    
    if not checkout_request_id:
        return Response(
            {"error": "checkout_request_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        response = query_stk_status(checkout_request_id)
        
        # Get the transaction from our DB
        transaction_obj = Transaction.objects.filter(checkout_request_id=checkout_request_id).first()

        # Determine M-Pesa result code
        # Daraja uses 'ResultCode' for final statuses and 'errorCode'/'errorMessage' for in-progress
        result_code = response.get('ResultCode')
        error_code = response.get('errorCode', '')

        # 500.001.1001 means "The transaction is being processed" - NOT a failure, keep polling
        # some Daraja responses use ResultCode == 1 with a "still processing" description
        STILL_PROCESSING_CODES = {'500.001.1001', '500.001.1000', '1'}
        desc = str(response.get('ResultDesc', '')).lower()
        is_still_processing = (
            str(error_code) in STILL_PROCESSING_CODES or
            str(result_code) in STILL_PROCESSING_CODES or
            'processing' in desc and 'success' not in desc
        )

        if not is_still_processing and result_code is not None and transaction_obj:
            # Only update the DB when Daraja gives us a final result code (0 = success, anything else = failure)
            process_stk_result(
                transaction_obj, 
                result_code, 
                response.get('ResultDesc', 'Query Result')
            )
            # Refetch to get updated status
            transaction_obj.refresh_from_db()
                
        # Always add internal status to response so frontend has a reliable source of truth
        if transaction_obj:
            response['internal_status'] = transaction_obj.status
            response['internal_result_code'] = transaction_obj.result_code
            response['internal_result_desc'] = transaction_obj.result_desc
        elif is_still_processing:
            response['internal_status'] = 'pending'

        return Response(response, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error querying M-Pesa status: {str(e)}")
        return Response(
            {"error": f"Failed to query status: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def wallet_transactions(request):
    """
    API endpoint to get transaction history for the authenticated user's wallet
    """
    try:
        # Get query parameters for pagination/filtering
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)  # Max 50 per page
        status_filter = request.query_params.get('status')
        
        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': 0.00}
        )
        
        # Build the base queryset
        # We only show successful wallet transaction history by default.
        # Exclude direct pass-through ride/booking payments that are only used for M-Pesa callbacks.
        transactions_query = Transaction.objects.filter(
            wallet=wallet,
            status='success'
        ).exclude(
            transaction_type__in=['booking', 'ride_fee'],
            mpesa_transaction_reference__isnull=False,
            ride__isnull=False
        ).exclude(
            transaction_type__in=['booking', 'ride_fee'],
            mpesa_transaction_reference__isnull=False,
            booking__isnull=False
        )

        # Ignore pending/failed requests to satisfy wallet history requirements.
        # If the frontend needs them later, this logic can be expanded explicitly.
        
        # Calculate pagination
        total_transactions = transactions_query.count()
        total_pages = (total_transactions + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated transactions
        transactions = transactions_query.order_by('-created_at')[offset:offset + page_size]
        
        # Auto-sync recent pending STK transactions to ensure frontend shows accurate status
        pending_txs = [tx for tx in transactions if tx.status == 'pending' and tx.checkout_request_id]
        if pending_txs:
            from payments.mpesa import query_stk_status
            
            for tx in pending_txs[:3]: # Limit to 3 to prevent slow response times
                try:
                    response = query_stk_status(tx.checkout_request_id)
                    result_code = response.get('ResultCode')
                    if result_code is not None:
                        process_stk_result(tx, result_code, response.get('ResultDesc', 'Auto Sync Result'))
                        tx.refresh_from_db()
                except Exception as e:
                    logger.error(f"Error auto-syncing STK status for tx {tx.id}: {str(e)}")
        
        def _transaction_details(tx):
            if tx.transaction_type == 'topup':
                if tx.booking and tx.booking.user:
                    passenger_name = tx.booking.user.get_full_name() or tx.booking.user.username
                    return f"BOOKING FEE FROM {passenger_name}"
                if tx.mpesa_transaction_reference:
                    return "MPESA TOP-UP"
                return "WALLET TOP-UP"

            if tx.transaction_type == 'earning':
                if tx.booking and tx.booking.user:
                    passenger_name = tx.booking.user.get_full_name() or tx.booking.user.username
                    return f"BOOKING PAYMENT TOP-UP FROM {passenger_name}"
                return "BOOKING PAYMENT TOP-UP"

            if tx.transaction_type == 'booking':
                if tx.booking and tx.booking.user:
                    passenger_name = tx.booking.user.get_full_name() or tx.booking.user.username
                    return f"BOOKING PAYMENT BY {passenger_name}"
                return "BOOKING PAYMENT"

            if tx.transaction_type == 'ride_fee':
                return "RIDE CREATION FEE"

            if tx.transaction_type == 'withdrawal':
                return "WALLET WITHDRAWAL"

            if tx.result_desc:
                return tx.result_desc.strip().upper()

            return tx.transaction_type.replace('_', ' ').upper()

        # Prepare response data
        transactions_data = [{
            'id': str(tx.id),
            'amount': float(tx.amount),
            'status': tx.status,
            'transaction_type': tx.transaction_type,
            'details': _transaction_details(tx),
            'mpesa_transaction_reference': tx.mpesa_transaction_reference or '',
            # keep old field available for backward compatibility
            'mpesa_receipt_number': tx.mpesa_receipt_number or '',
            'created_at': tx.created_at.isoformat(),
            'type': 'credit' if tx.amount >= 0 else 'debit',
            'result_code': tx.result_code,
            'result_desc': tx.result_desc,
            'completed_at': tx.completed_at.isoformat() if tx.completed_at else None
        } for tx in transactions]
        
        return Response({
            'success': True,
            'meta': {
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'total_items': total_transactions
            },
            'data': transactions_data
        })
        
    except ValueError as e:
        return Response(
            {"error": "Invalid query parameters"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching transactions: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def process_stk_result(transaction_obj, result_code, result_desc, callback_metadata=None):
    """
    Shared logic to handle M-Pesa STK result (success or failure).
    Updates transaction status, wallet balance, and confirms bookings.
    Returns True if processed, False if already handled.
    """
    # Guard: Never process 'still processing' responses as failures.
    # Daraja may return numeric 1 or the 500.00x codes with a "being processed" message.
    STILL_PROCESSING_CODES = {'500.001.1001', '500.001.1000', '1'}
    desc = str(result_desc or '').lower()
    if (str(result_code) in STILL_PROCESSING_CODES or
            ('processing' in desc and 'success' not in desc)):
        logger.info(
            f"Transaction {getattr(transaction_obj, 'checkout_request_id', '?')} is still processing "
            f"(code: {result_code}, desc: {result_desc}). Skipping update."
        )
        return False

    with db_transaction.atomic():
        # Get fresh copy and lock it
        transaction_obj = Transaction.objects.select_for_update().get(id=transaction_obj.id)
        
        if transaction_obj.status == "success":
            logger.info(f"Transaction {transaction_obj.checkout_request_id} already marked as success.")
            return False
            
        # Allow success to override failed (e.g. if polling was wrong/premature)
        if transaction_obj.status == "failed" and str(result_code) != "0":
            logger.info(f"Transaction {transaction_obj.checkout_request_id} already marked as failed.")
            return False
            
        transaction_obj.result_code = result_code
        transaction_obj.result_desc = result_desc
        transaction_obj.completed_at = timezone.now()

        if str(result_code) == "0":
            # Success logic
            amount = transaction_obj.amount
            mpesa_receipt = None
            
            if callback_metadata:
                # Extract from callback metadata format.  older code only pulled
                # the receipt number; we now look for any of the possible
                # reference identifiers and store it in the new field.
                items = callback_metadata.get('Item', [])
                logger.info(f"Processing callback metadata for {transaction_obj.checkout_request_id}: {json.dumps(items)}")
                for item in items:
                    name = item.get('Name')
                    if name == 'Amount':
                        amount = Decimal(str(item.get('Value', amount)))
                    elif name in ('MpesaReceiptNumber', 'TransactionID', 'MpesaTransactionID', 'TransactionReference'):
                        # whichever identifier MPESA sends; these tend to be the
                        # value customers refer to when making inquiries.
                        mpesa_receipt = item.get('Value', '')
                        transaction_obj.mpesa_transaction_reference = mpesa_receipt
            
            transaction_obj.status = "success"
            if mpesa_receipt:
                transaction_obj.mpesa_receipt_number = mpesa_receipt
            
            # Ensure topup type is set if not already (safeguard)
            if not transaction_obj.transaction_type:
                transaction_obj.transaction_type = "topup"
                
            transaction_obj.save()
            
            wallet = transaction_obj.wallet
            wallet.balance += amount
            wallet.save()
            
            logger.info(f"Successfully processed payment for {wallet.user.username}: {mpesa_receipt or 'N/A'} for KES {amount}")
            
            # Notification for top-up success only for actual wallet top-ups.
            if transaction_obj.transaction_type == "topup":
                Notification.objects.create(
                    user=wallet.user,
                    title="Wallet Top-up Success",
                    message=f"Your wallet has been topped up with KES {amount}. Receipt: {mpesa_receipt or 'N/A'}",
                    notification_type="success"
                )

            # Platform Fee / Ride activation logic
            try:
                if transaction_obj.ride:
                    ride = transaction_obj.ride
                    if ride.status == 'pending_payment':
                        ride.status = 'available'
                        ride.save()
                        logger.info(f"Activated ride {ride.id} after platform fee payment.")
                        
                        # Deduct the fee from wallet (Pass-through)
                        wallet.balance -= amount
                        wallet.save()
                        
                        # Create a debit transaction for the fee
                        Transaction.objects.create(
                            wallet=wallet,
                            amount=-amount,
                            status="success",
                            result_code=0,
                            result_desc=f"Platform Fee for Ride #{ride.id}",
                            completed_at=timezone.now(),
                            ride=ride,
                            mpesa_transaction_reference=transaction_obj.mpesa_transaction_reference,
                            transaction_type="ride_fee"
                        )
                        
                        # Notification for the driver
                        Notification.objects.create(
                            user=ride.driver,
                            title="Ride Activated!",
                            message=(
                                f"Your ride from {ride.departure_location} to {ride.destination} is now active. "
                                f"Paid via M-Pesa (Ref: {mpesa_receipt or 'N/A'}) at "
                                f"{transaction_obj.completed_at.strftime('%H:%M on %d %b %Y') if transaction_obj.completed_at else 'N/A'}."
                            ),
                            notification_type="success"
                        )
            except Exception as e:
                logger.error(f"Error in ride activation: {str(e)}", exc_info=True)

            # Booking confirmation logic
            try:
                from rides.models import Booking
                
                # Only explicit booking-payment transactions may confirm bookings.
                pending_booking = transaction_obj.booking if transaction_obj.transaction_type == "booking" else None
                
                if pending_booking and pending_booking.status == 'pending':
                    subtotal = pending_booking.ride.price * Decimal(pending_booking.no_of_seats)
                    expected_amount = (subtotal * Decimal('1.05')).quantize(Decimal('0.01'))
                    
                    # Allow a small margin of error (1 KES) to account for rounding by Daraja/M-Pesa
                    if amount >= (expected_amount - Decimal('1.0')):
                        # Confirm the booking
                        pending_booking.confirm_payment()
                        
                        # Credit the driver with the booking amount less the platform fee
                        driver_amount = (pending_booking.ride.price * Decimal(pending_booking.no_of_seats)).quantize(Decimal('0.01'))
                        driver_wallet, _ = Wallet.objects.get_or_create(user=pending_booking.ride.driver)
                        driver_wallet = Wallet.objects.select_for_update().get(id=driver_wallet.id)
                        driver_wallet.balance += driver_amount
                        driver_wallet.save()

                        Transaction.objects.create(
                            wallet=driver_wallet,
                            amount=driver_amount,
                            status="success",
                            result_code=0,
                            result_desc=f"Earnings from Booking #{pending_booking.id}",
                            completed_at=timezone.now(),
                            booking=pending_booking,
                            ride=pending_booking.ride,
                            mpesa_transaction_reference=transaction_obj.mpesa_transaction_reference,
                            transaction_type="earning"
                        )

                        # Send confirmation emails
                        try:
                            from rides.utils import send_booking_confirmation_email, send_booking_confirmed_to_driver_email
                            send_booking_confirmation_email(pending_booking)
                            send_booking_confirmed_to_driver_email(pending_booking)
                        except Exception as e:
                            logger.error(f"Error sending emails in M-Pesa callback: {str(e)}")
                        
                        # Deduct from wallet immediately (Debit)
                        wallet.balance -= expected_amount
                        wallet.save()
                        
                        # Create a debit transaction for the booking
                        Transaction.objects.create(
                            wallet=wallet,
                            amount=-expected_amount,
                            status="success",
                            result_code=0,
                            result_desc=f"Payment for Booking #{pending_booking.id}",
                            completed_at=timezone.now(),
                            booking=pending_booking,
                            mpesa_transaction_reference=transaction_obj.mpesa_transaction_reference,
                            transaction_type="booking"
                        )
                        logger.info(f"Confirmed booking {pending_booking.id} and deducted KES {expected_amount}")
                        
                        # Notification for booking success
                        ride = pending_booking.ride
                        Notification.objects.create(
                            user=wallet.user,
                            title="Ride Booking Confirmed",
                            message=(
                                f"Your booking for ride from {ride.departure_location} to {ride.destination} has been confirmed. "
                                f"Paid via M-Pesa (Ref: {mpesa_receipt or 'N/A'}) at "
                                f"{transaction_obj.completed_at.strftime('%H:%M on %d %b %Y') if transaction_obj.completed_at else 'N/A'}. "
                                # f"KES {expected_amount} deducted from wallet."
                            ),
                            notification_type="success"
                        )

                        # Notification for the driver
                        Notification.objects.create(
                            user=ride.driver,
                            title="New Confirmed Booking",
                            message=(
                                f"A booking for your ride from {ride.departure_location} to {ride.destination} has been paid via M-Pesa "
                                f"(Ref: {mpesa_receipt or 'N/A'}) and confirmed at "
                                f"{transaction_obj.completed_at.strftime('%H:%M on %d %b %Y') if transaction_obj.completed_at else 'N/A'}."
                            ),
                            notification_type="success"
                        )
                elif transaction_obj.transaction_type == "booking" and not pending_booking:
                    logger.warning(
                        "Booking payment transaction %s completed without an attached booking.",
                        transaction_obj.checkout_request_id
                    )
            except Exception as e:
                logger.error(f"Error in booking confirmation: {str(e)}", exc_info=True)
        else:
            # Failure logic
            transaction_obj.status = "failed"
            transaction_obj.save()
            logger.warning(f"Payment failed/cancelled for {transaction_obj.checkout_request_id}: {result_desc}")
            
            # Notification for payment failure
            Notification.objects.create(
                user=transaction_obj.wallet.user,
                title="Payment Failed",
                message=f"Your payment of KES {transaction_obj.amount} failed or was cancelled. Reason: {result_desc}",
                notification_type="error"
            )
            
        return True

@csrf_exempt
def mpesa_callback(request, secret=None):
    """Handle M-Pesa STK Push and B2C Payout callbacks"""
    from django.conf import settings
    import json
    
    # 1. URL Token Validation
    expected_secret = getattr(settings, 'MPESA_WEBHOOK_SECRET', 'default_secret_please_change_me')
    if secret != expected_secret:
        logger.warning(f"Blocked unauthorized M-Pesa callback with invalid secret")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Unauthorized Token"}, status=403)
        
    # 2. IP Validation
    SAFARICOM_IPS = ['196.201.214.', '196.201.213.', '196.201.212.', '196.196.164.']
    x_forwarded_for = request.headers.get('x-forwarded-for')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
        
    # Allow local development bypass or safaricom IPs
    is_valid_ip = getattr(settings, 'DEBUG', False) or (ip and any(ip.startswith(prefix) for prefix in SAFARICOM_IPS))
    if not is_valid_ip:
        logger.warning(f"Blocked unauthorized M-Pesa callback from IP: {ip}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Unauthorized IP"}, status=403)

    try:
        raw_body = request.body.decode('utf-8')
        logger.info(f"M-Pesa Callback received: {raw_body}")
        data = json.loads(raw_body)
        
        # 3. Payload validation
        if not (('Body' in data and 'stkCallback' in data['Body']) or ('Result' in data) or ('stkCallback' in data)):
            logger.warning("Blocked malformed M-Pesa payload")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Malformed Payload"}, status=400)
        
        # 1. Handle STK Push Callback
        if 'Body' in data and 'stkCallback' in data['Body']:
            stk_callback = data['Body']['stkCallback']
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            metadata = stk_callback.get('CallbackMetadata')
            
            transaction_obj = Transaction.objects.filter(checkout_request_id=checkout_request_id).first()
            if not transaction_obj:
                logger.error(f"STK Transaction not found: {checkout_request_id}")
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
                
            process_stk_result(transaction_obj, result_code, result_desc, metadata)
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})
            
        # 2. Handle B2C Withdrawal Callback
        elif 'Result' in data:
            b2c_result = data['Result']
            conversation_id = b2c_result.get('ConversationID')
            originator_id = b2c_result.get('OriginatorConversationID')
            result_code = b2c_result.get('ResultCode')
            result_desc = b2c_result.get('ResultDesc')
            
            # Safaricom may send either ConversationID or OriginatorConversationID.
            # Try matching both to avoid missing the transaction record.
            transaction_obj = Transaction.objects.filter(
                transaction_type="withdrawal"
            ).filter(
                Q(mpesa_transaction_reference=conversation_id) |
                Q(mpesa_transaction_reference=originator_id)
            ).first()
            
            if not transaction_obj:
                logger.error(
                    f"B2C Transaction not found for ConversationID: {conversation_id} or OriginatorConversationID: {originator_id}"
                )
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
            
            with db_transaction.atomic():
                transaction_obj = Transaction.objects.select_for_update().get(id=transaction_obj.id)
                if transaction_obj.status != "pending":
                    return JsonResponse({"ResultCode": 0, "ResultDesc": "Already processed"})
                
                transaction_obj.result_code = result_code
                transaction_obj.result_desc = result_desc
                transaction_obj.completed_at = timezone.now()
                
                if str(result_code) == "0":
                    transaction_obj.status = "success"
                    # Capture M-Pesa Transaction ID if available
                    ref_id = b2c_result.get('TransactionID')
                    if ref_id:
                        transaction_obj.mpesa_receipt_number = ref_id
                    
                    # Notification for success
                    Notification.objects.create(
                        user=transaction_obj.wallet.user,
                        title="Withdrawal Successful",
                        message=f"Your withdrawal of KES {abs(transaction_obj.amount)} was successful. Ref: {ref_id or 'N/A'}",
                        notification_type="success"
                    )
                else:
                    transaction_obj.status = "failed"
                    # Rollback wallet balance on failure
                    wallet = transaction_obj.wallet
                    wallet.balance += abs(transaction_obj.amount)
                    wallet.save()
                    
                    # Notification for failure
                    Notification.objects.create(
                        user=transaction_obj.wallet.user,
                        title="Withdrawal Failed",
                        message=f"Your withdrawal of KES {abs(transaction_obj.amount)} failed. Reason: {result_desc}",
                        notification_type="error"
                    )
                
                transaction_obj.save()
            
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})
            
        else:
            logger.error(f"Unknown callback format: {raw_body}")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Unknown format"})
            
    except Exception as e:
        logger.error(f"Callback error: {str(e)}", exc_info=True)
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Internal Error"})

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def wallet_view(request):
    """API endpoint to get wallet information and recent transactions"""
    try:
        wallet, created = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': 0.00}
        )
        transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:10]
        
        # Auto-sync recent pending STK transactions to ensure frontend shows accurate status
        pending_txs = [tx for tx in transactions if tx.status == 'pending' and tx.checkout_request_id]
        if pending_txs:
            from payments.mpesa import query_stk_status
            
            for tx in pending_txs[:3]: # Limit to 3 to prevent slow response times
                try:
                    response = query_stk_status(tx.checkout_request_id)
                    result_code = response.get('ResultCode')
                    if result_code is not None:
                        process_stk_result(tx, result_code, response.get('ResultDesc', 'Auto Sync Result'))
                        tx.refresh_from_db()
                except Exception as e:
                    logger.error(f"Error auto-syncing STK status for tx {tx.id} in wallet_view: {str(e)}")
        
        # Prepare transactions data
        transactions_data = [{
            'id': str(tx.id),
            'amount': float(tx.amount),
            'status': tx.status,
            'mpesa_receipt_number': tx.mpesa_receipt_number or '',
            'created_at': tx.created_at.isoformat(),
            'result_code': tx.result_code,
            'result_desc': tx.result_desc,
            'completed_at': tx.completed_at.isoformat() if tx.completed_at else None
        } for tx in transactions]
        
        return Response({
            'success': True,
            'wallet': {
                'id': str(wallet.id),
                'balance': float(wallet.balance),
                'user_id': str(wallet.user.id),
            },
            'transactions': transactions_data
        })
        
    except Exception as e:
        logger.error(f"Error in wallet_view: {str(e)}", exc_info=True)
        return Response(
            {"error": f"An error occurred while fetching wallet information: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
