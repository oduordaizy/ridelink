import requests
import base64
import json
import logging
from decimal import Decimal
from requests.auth import HTTPBasicAuth
from datetime import datetime
from django.conf import settings

# Set up logging
logger = logging.getLogger(__name__)

def get_mpesa_urls():
    """Get MPESA API URLs based on environment settings.

    Defaults to sandbox if MPESA_ENV is not set or not exactly 'production'.
    This is case-insensitive and tolerant of extra whitespace.
    """
    env = (getattr(settings, 'MPESA_ENV', 'sandbox') or 'sandbox').strip().lower()
    if env == 'production':
        return {
            "oauth": "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            "stk_push": "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            "stk_query": "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query",
            "reversal": "https://api.safaricom.co.ke/mpesa/reversal/v1/request",
            "c2b_register": "https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl",
            "transaction_status": "https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query",
            "account_balance": "https://api.safaricom.co.ke/mpesa/accountbalance/v1/query",
            "b2c": "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
        }
    return {
        "oauth": "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        "stk_push": "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        "stk_query": "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
        "reversal": "https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request",
        "c2b_register": "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl",
        "transaction_status": "https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query",
        "account_balance": "https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query",
        "b2c": "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
    }


def normalize_phone_number(phone_number: str) -> str:
    """Normalize a phone number to E.164 without + (e.g. 2547XXXXXXXX)."""
    phone = str(phone_number or '').strip()
    # Remove common formatting characters
    phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if phone.startswith('+'):
        phone = phone[1:]
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone

    if not (len(phone) == 12 and phone.isdigit()):
        raise ValueError(f"Invalid phone number format: {phone}. Expected format: 2547XXXXXXXX")
    return phone


def get_callback_url() -> str:
    """Return the configured MPESA callback URL, validating it is usable."""
    callback_url = getattr(settings, 'CALLBACK_URL', None)
    if not callback_url:
        raise ValueError("MPESA CALLBACK_URL is not configured")
    if not callback_url.startswith('https://'):
        raise ValueError("MPESA CALLBACK_URL must be an https:// URL")
    return callback_url


def get_access_token():
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    api_url = get_mpesa_urls()["oauth"]

    try:
        response = requests.get(api_url, auth=HTTPBasicAuth(consumer_key, consumer_secret), timeout=30)
        if response.status_code != 200:
            # Log entire response text for debugging (token errors are common)
            logger.error(
                "Failed to get access token: %s %s",
                response.status_code,
                response.text
            )
            return None

        data = response.json()
        token = data.get("access_token")
        if not token:
            logger.error("Failed to get access token: missing access_token in response: %s", data)
            return None

        return token

    except Exception as e:
        logger.error(f"Failed to get access token: {str(e)}")
        return None

def lipa_na_mpesa(phone_number, amount, account_reference, transaction_desc):
    """
    Initiate STK push to customer's phone
    
    Args:
        phone_number (str): Customer phone number in format 2547XXXXXXXX
        amount (float): Amount to charge
        account_reference (str): Account reference
        transaction_desc (str): Transaction description
        
    Returns:
        dict: Response from MPESA API or error details
    """
    # MPESA API credentials
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    
# Ensure phone number is in the correct format (2547XXXXXXXX)
    try:
        phone_number = normalize_phone_number(phone_number)
    except ValueError as e:
        error_msg = str(e)
        logger.error(error_msg)
        return {"error": error_msg, "code": "INVALID_PHONE"}
    
    # Generate timestamp (YYYYMMDDHHMMSS)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Generate password (Base64 encoded)
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    
    # Get access token
    access_token = get_access_token()
    if not access_token:
        return {"error": "Failed to get access token from MPESA API", "code": "AUTH_ERROR"}
    
    # Prepare request
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Use ngrok URL for local development or your production URL
    try:
        callback_url = get_callback_url()
    except ValueError as e:
        error_msg = f"MPESA callback URL issue: {e}"
        logger.error(error_msg)
        return {"error": error_msg, "code": "INVALID_CALLBACK_URL"}
    
    # Prepare request payload
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(round(float(amount))),
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": account_reference[:12],
        "TransactionDesc": transaction_desc[:13]
    }
    
    # Log the request (without sensitive data)
    log_payload = payload.copy()
    log_payload["Password"] = "*****"
    logger.info(f"Sending MPESA request to {callback_url}: {json.dumps(log_payload, indent=2)}")
    
    try:
        # Make the API request
        api_url = get_mpesa_urls()["stk_push"]
        logger.info(f"Initiating STK Push to {api_url}")
        
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        # Log the response status and full text for debugging
        logger.info(f"MPESA API Response Status: {response.status_code}")
        logger.info(f"MPESA API Response Body: {response.text}")
        
        # Check for HTTP errors
        if response.status_code != 200:
            error_data = response.json() if response.status_code == 400 or response.status_code == 500 else {"errorMessage": response.text}
            error_msg = f"MPESA API error ({response.status_code}): {error_data.get('errorMessage', response.text)}"
            logger.error(error_msg)
            return {"error": error_msg, "code": error_data.get('errorCode', 'HTTP_ERROR')}
        
        response_data = response.json()
        
        # Check for API-level errors
        if 'errorCode' in response_data:
            error_msg = f"MPESA API logic error: {response_data.get('errorMessage', 'Unknown error')}"
            logger.error(error_msg)
            return {"error": error_msg, "code": response_data.get('errorCode')}
            
        return response_data
        
    except requests.exceptions.RequestException as e:
        error_msg = f"MPESA API request failed (Network/Timeout): {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" - {e.response.status_code}: {e.response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "code": "REQUEST_FAILED"}

def mpesa_reversal(transaction_id, amount, receiver_party, reason):
    """
    Initiate a reversal for a specific transaction.
    """
    shortcode = settings.MPESA_SHORTCODE
    initiator = settings.MPESA_INITIATOR_USERNAME
    security_credential = settings.MPESA_INITIATOR_SECURITY_CREDENTIAL
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    access_token = get_access_token()
    if not access_token:
        return {"error": "Authentication failed"}

    payload = {
        "Initiator": initiator,
        "SecurityCredential": security_credential,
        "CommandID": "TransactionReversal",
        "TransactionID": transaction_id,
        "Amount": int(amount),
        "ReceiverParty": receiver_party,
        "ReceiverIdentifierType": "11", # 11 for Organization
        "ResultURL": settings.CALLBACK_URL,
        "QueueTimeOutURL": settings.CALLBACK_URL,
        "Remarks": reason[:100],
        "Occasion": "Reversal"
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    
    try:
        response = requests.post(get_mpesa_urls()["reversal"], json=payload, headers=headers, timeout=30)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def query_stk_status(checkout_request_id):
    """
    Query the status of an STK push transaction.
    """
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    
    access_token = get_access_token()
    if not access_token:
        return {"error": "Authentication failed"}

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    
    try:
        api_url = get_mpesa_urls()["stk_query"]
        logger.info(f"Querying STK Status for {checkout_request_id} at {api_url}")
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        logger.info(f"STK Query Response status: {response.status_code}")
        logger.info(f"STK Query Response body: {response.text}")
        return response.json()
    except Exception as e:
        logger.error(f"STK Query Exception: {str(e)}")
        return {"error": str(e)}

def get_account_balance():
    """
    Fetch the current Paybill/BuyGoods account balance.
    """
    shortcode = settings.MPESA_SHORTCODE
    initiator = settings.MPESA_INITIATOR_USERNAME
    security_credential = settings.MPESA_INITIATOR_SECURITY_CREDENTIAL
    
    access_token = get_access_token()
    if not access_token:
        return {"error": "Authentication failed"}

    try:
        callback_url = get_callback_url()
    except ValueError as e:
        return {"error": f"MPESA callback URL issue: {e}", "code": "INVALID_CALLBACK_URL"}

    payload = {
        "Initiator": initiator,
        "SecurityCredential": security_credential,
        "CommandID": "AccountBalance",
        "PartyA": shortcode,
        "IdentifierType": "4", # 4 for Shortcode
        "Remarks": "Balance Check",
        "QueueTimeOutURL": callback_url,
        "ResultURL": callback_url
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    
    try:
        response = requests.post(get_mpesa_urls()["account_balance"], json=payload, headers=headers, timeout=30)
        return response.json()
    except Exception as e:
        return {"error": str(e)}
def b2c_payout(phone_number, amount, remarks, occasion="Withdrawal"):
    """
    Initiate a B2C (Business to Customer) payment.
    Requires funds in the Utility account.
    """
    shortcode = settings.MPESA_SHORTCODE
    initiator = settings.MPESA_INITIATOR_USERNAME
    security_credential = settings.MPESA_INITIATOR_SECURITY_CREDENTIAL
    
    # Normalize phone number for B2C payout
    try:
        phone_number = normalize_phone_number(phone_number)
    except ValueError as e:
        error_msg = str(e)
        logger.error(error_msg)
        return {"error": error_msg, "code": "INVALID_PHONE"}

    try:
        callback_url = get_callback_url()
    except ValueError as e:
        error_msg = f"MPESA callback URL issue: {e}"
        logger.error(error_msg)
        return {"error": error_msg, "code": "INVALID_CALLBACK_URL"}

    access_token = get_access_token()
    if not access_token:
        return {"error": "Authentication failed", "code": "AUTH_ERROR"}

    # Validate amount is a whole number (MPESA expects integer shillings)
    try:
        amount_decimal = Decimal(str(amount))
    except Exception:
        return {"error": "Invalid amount", "code": "INVALID_AMOUNT"}

    if amount_decimal != amount_decimal.quantize(1):
        return {"error": "Amount must be a whole number (no cents)", "code": "INVALID_AMOUNT"}

    amount_int = int(amount_decimal)

    # Prepare request payload
    payload = {
        "InitiatorName": initiator,
        "SecurityCredential": security_credential,
        "CommandID": "BusinessPayment",
        "Amount": amount_int,
        "PartyA": shortcode,
        "PartyB": phone_number,
        "Remarks": remarks[:100],
        "QueueTimeOutURL": callback_url,
        "ResultURL": callback_url,
        "Occasion": occasion[:100]
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        api_url = get_mpesa_urls()["b2c"]
        logger.info(f"Initiating B2C Payout to {phone_number} for KES {amount}")
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        logger.info(f"B2C API Response Status: {response.status_code}")
        logger.info(f"B2C API Response Body: {response.text}")

        # Detect invalid access token error and offer a helpful hint
        try:
            data = response.json()
        except ValueError:
            return {
                "error": "Invalid JSON response from MPESA",
                "status_code": response.status_code,
                "body": response.text
            }

        # If Daraja says the token is invalid, try once more (common sandbox quirk)
        error_desc = (data.get("errorMessage") or data.get("ResponseDescription") or "").lower()
        if "invalid access token" in error_desc:
            logger.warning("B2C payout returned invalid access token; retrying token fetch once")
            access_token = get_access_token()
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
                response = requests.post(api_url, json=payload, headers=headers, timeout=30)
                logger.info(f"B2C Retry Response Status: {response.status_code}")
                logger.info(f"B2C Retry Response Body: {response.text}")
                try:
                    data = response.json()
                except ValueError:
                    return {"error": "Invalid JSON response from MPESA (retry)", "status_code": response.status_code, "body": response.text}

        return data
    except Exception as e:
        logger.error(f"B2C Payout Exception: {str(e)}")
        return {"error": str(e), "code": "REQUEST_FAILED"}
