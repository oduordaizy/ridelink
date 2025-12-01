from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
import json
from .models import Transaction, Wallet
from .mpesa import lipa_na_mpesa
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
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid amount. Must be a positive number."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the payment
        with transaction.atomic():
            # Get or create wallet for the user
            wallet, created = Wallet.objects.get_or_create(
                user=user,
                defaults={'balance': 2600.00}  # Initial balance set to KES 1000
            )
            
            # Create a pending transaction
            transaction_obj = Transaction.objects.create(
                wallet=wallet,
                amount=amount,
                status="pending"
            )
            
            # Initiate MPESA payment
            response = lipa_na_mpesa(
                phone_number=phone_number,
                amount=amount,
                account_reference=f"WALLET_{user.id}",
                transaction_desc="Wallet Top Up"
            )
            
            # Handle MPESA API response
            if "error" in response:
                transaction_obj.status = "failed"
                transaction_obj.save()
                return Response(
                    {"error": f"Payment initiation failed: {response.get('error')}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Update transaction with MPESA request ID
            if 'MerchantRequestID' in response:
                transaction_obj.mpesa_request_id = response.get('MerchantRequestID')
                transaction_obj.save()
            
            return Response({
                "success": True,
                "message": "Payment initiated successfully",
                "checkout_request_id": response.get('CheckoutRequestID'),
                "transaction_id": str(transaction_obj.id)
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
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
            defaults={'balance': 2600.00}  # Initial balance set to KES 1000
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
            defaults={'balance': 2600.00}  # Initial balance set to KES 1000
        )
        
        # Build the base queryset
        transactions_query = Transaction.objects.filter(wallet=wallet)
        
        # Apply status filter if provided
        if status_filter and status_filter in ['pending', 'success', 'failed']:
            transactions_query = transactions_query.filter(status=status_filter)
        
        # Calculate pagination
        total_transactions = transactions_query.count()
        total_pages = (total_transactions + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated transactions
        transactions = transactions_query.order_by('-created_at')[offset:offset + page_size]
        
        # Prepare response data
        transactions_data = [{
            'id': str(tx.id),
            'amount': float(tx.amount),
            'status': tx.status,
            'mpesa_receipt_number': tx.mpesa_receipt_number or '',
            'created_at': tx.created_at.isoformat(),
            'type': 'credit' if tx.amount >= 0 else 'debit'
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

@csrf_exempt
def mpesa_callback(request):
    """Handle M-Pesa STK Push callback"""
    try:
        # Log the raw request body for debugging
        raw_body = request.body.decode('utf-8')
        logger.info(f"M-Pesa Callback Received: {raw_body}")
        
        data = json.loads(raw_body)
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        
        # Log the callback data
        logger.info(f"M-Pesa Callback Data: {json.dumps(data, indent=2)}")
        
        # Check if this is a valid callback
        if not stk_callback:
            logger.error("Invalid callback format - missing stkCallback")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid callback format"})
        
        result_code = stk_callback.get('ResultCode')
        
        # If the payment was successful
        if result_code == 0:
            try:
                # Extract transaction details
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])
                
                # Extract values from callback items
                amount = None
                mpesa_receipt = None
                phone = None
                
                for item in items:
                    if item.get('Name') == 'Amount':
                        amount = float(item.get('Value', 0))
                    elif item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt = item.get('Value', '')
                    elif item.get('Name') == 'PhoneNumber':
                        phone = str(item.get('Value', '')).lstrip('0')
                
                if not all([amount, mpesa_receipt, phone]):
                    logger.error(f"Missing required fields in callback: amount={amount}, receipt={mpesa_receipt}, phone={phone}")
                    return JsonResponse({"ResultCode": 1, "ResultDesc": "Missing required fields"})
                
                # Find the pending transaction
                transaction = Transaction.objects.filter(
                    status="pending",
                    amount=amount
                ).filter(
                    wallet__user__phone_number__endswith=phone[-9:]
                ).order_by('-created_at').first()
                
                if not transaction:
                    logger.error(f"No pending transaction found for amount: {amount}, phone: {phone}")
                    return JsonResponse({"ResultCode": 1, "ResultDesc": "Transaction not found"})
                
                # Update transaction status
                with transaction.atomic():
                    transaction.status = "success"
                    transaction.mpesa_receipt_number = mpesa_receipt
                    transaction.save()
                    
                    # Update wallet balance
                    wallet = transaction.wallet
                    wallet.balance += amount
                    wallet.save()
                    
                    logger.info(f"Successfully processed payment: {mpesa_receipt} for KES {amount}")
                
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})
                
            except Exception as e:
                logger.error(f"Error processing successful payment: {str(e)}", exc_info=True)
                return JsonResponse({"ResultCode": 1, "ResultDesc": f"Error: {str(e)}"})
        
        else:
            # Payment failed or was cancelled
            error_msg = stk_callback.get('ResultDesc', 'Payment failed')
            logger.warning(f"Payment failed: {error_msg}")
            
            # Try to find and update the transaction
            try:
                merchant_request_id = stk_callback.get('MerchantRequestID')
                checkout_request_id = stk_callback.get('CheckoutRequestID')
                
                if merchant_request_id or checkout_request_id:
                    transaction = Transaction.objects.filter(
                        status="pending",
                        mpesa_request_id__in=[merchant_request_id, checkout_request_id, '']
                    ).first()
                    
                    if transaction:
                        transaction.status = "failed"
                        transaction.save()
                        logger.info(f"Updated transaction {transaction.id} to failed status")
            
            except Exception as e:
                logger.error(f"Error updating failed transaction: {str(e)}", exc_info=True)
            
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Callback processed"})
    
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in callback: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid JSON"})
    
    except Exception as e:
        logger.error(f"Unexpected error in callback: {str(e)}", exc_info=True)
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Internal server error"})

@csrf_exempt
@require_http_methods(["GET"])
def wallet_view(request):
    """API endpoint to get wallet information and recent transactions"""
    try:
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "Authentication credentials were not provided."}, 
                status=401
            )
            
        wallet, created = Wallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': 1000.00}  # Initial balance set to KES 1000
        )
        transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')[:10]
        
        # Prepare transactions data
        transactions_data = [{
            'id': str(tx.id),
            'amount': float(tx.amount),
            'status': tx.status,
            'mpesa_receipt_number': tx.mpesa_receipt_number or '',
            'created_at': tx.created_at.isoformat(),
        } for tx in transactions]
        
        return JsonResponse({
            'success': True,
            'wallet': {
                'id': str(wallet.id),
                'balance': float(wallet.balance),
                'user_id': str(wallet.user.id),
            },
            'transactions': transactions_data
        })
        
    except Exception as e:
        return JsonResponse(
            {"error": f"An error occurred while fetching wallet information: {str(e)}"},
            status=500
        )