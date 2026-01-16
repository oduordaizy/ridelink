import requests
import json

url = "http://localhost:8000/api/auth/register/"
data = {
    "username": "debug_req_1",
    "email": "debug_req_1@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "Req",
    "last_name": "User",
    "phone_number": "+254733333333",
    "user_type": "passenger"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Content:")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
