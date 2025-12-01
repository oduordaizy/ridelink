import requests
import base64
import json
import logging
from requests.auth import HTTPBasicAuth
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

def get_access_token():
    consumer_key = "HmooGXDUPyGx1kXbXKMoy27MrUwElwULXe7wEL0FTYlaUL5K"
    consumer_secret = "9c9kOcbgaJ94sUcowbQzPH6BehMJL0wuxKaAe8GaY3B0cPBVExBgp1LJc257YVYC"
    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    try:
        response = requests.get(api_url, auth=HTTPBasicAuth(consumer_key, consumer_secret), timeout=30)
        response.raise_for_status()
        return response.json().get("access_token")
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
    shortcode = "174379"  # Test credentials
    passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    
    # Ensure phone number is in the correct format (strip + or 0 and add 254 if needed)
    phone_number = str(phone_number).strip()
    if phone_number.startswith('+'):
        phone_number = phone_number[1:]
    if phone_number.startswith('0'):
        phone_number = '254' + phone_number[1:]
    elif not phone_number.startswith('254'):
        phone_number = '254' + phone_number
    
    # Validate phone number
    if not (len(phone_number) == 12 and phone_number.isdigit()):
        error_msg = f"Invalid phone number format: {phone_number}. Expected format: 2547XXXXXXXX"
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
    callback_url = "https://fb4ba3e603cf.ngrok-free.app/api/payments/mpesa/callback/"
    
    # Prepare request payload
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": str(int(amount)),
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
    logger.info(f"Sending MPESA request: {json.dumps(log_payload, indent=2)}")
    
    try:
        # Make the API request
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        # Log the response
        logger.info(f"MPESA API Response: {response.status_code} - {response.text}")
        
        # Check for HTTP errors
        response.raise_for_status()
        
        response_data = response.json()
        
        # Check for API-level errors
        if 'errorCode' in response_data:
            error_msg = f"MPESA API error: {response_data.get('errorMessage', 'Unknown error')}"
            logger.error(error_msg)
            return {"error": error_msg, "code": response_data.get('errorCode')}
            
        return response_data
        
    except requests.exceptions.RequestException as e:
        error_msg = f"MPESA API request failed: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" - {e.response.status_code}: {e.response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "code": "REQUEST_FAILED"}
        logger.info(f"MPESA API Response: {response.status_code} - {response.text}")
        
        # Check for HTTP errors
        response.raise_for_status()
        
        response_data = response.json()
        
        # Check for API-level errors
        if 'errorCode' in response_data:
            error_msg = f"MPESA API error: {response_data.get('errorMessage', 'Unknown error')}"
            logger.error(error_msg)
            return {"error": error_msg, "code": response_data.get('errorCode')}
            
        return response_data
        
    except requests.exceptions.RequestException as e:
        error_msg = f"MPESA API request failed: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" - {e.response.status_code}: {e.response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "code": "REQUEST_FAILED"}
