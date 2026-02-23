export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + '/api';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: 'driver' | 'passenger';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    user_type: string;
    is_verified: boolean;
    is_staff: boolean;
    is_superuser: boolean;
  };
}

export const authAPI = {
  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const anyData = errorData as any;
      const errorMessage = anyData.message ||
        (anyData.non_field_errors && anyData.non_field_errors[0]) ||
        (Object.values(anyData)[0] && Array.isArray(Object.values(anyData)[0]) ? (Object.values(anyData)[0] as any)[0] : Object.values(anyData)[0]) ||
        'Login failed';
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // For validation errors (400), pass the whole object through
      if (response.status === 400) {
        throw new Error(JSON.stringify(errorData));
      }

      const anyData = errorData as any;
      const errorMessage = anyData.message ||
        (anyData.error && (Array.isArray(anyData.error) ? anyData.error[0] : anyData.error)) ||
        (anyData.non_field_errors && anyData.non_field_errors[0]) ||
        (Object.values(anyData)[0] && Array.isArray(Object.values(anyData)[0]) ? (Object.values(anyData)[0] as any)[0] : Object.values(anyData)[0]) ||
        'Registration failed';
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get user profile
  async getProfile(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  // Logout
  async logout(refreshToken: string) {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    return response.ok;
  },

  // Send OTP
  async sendOtp(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send OTP');
    }
    return response.json();
  },

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid OTP');
    }

    return response.json();
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send reset code');
    }

    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(responseData.error);
    }
    return responseData;
  },

  // Reset password
  async resetPassword(data: any): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const anyData = errorData as any;
      const errorMessage = anyData.message ||
        (anyData.error && (Array.isArray(anyData.error) ? anyData.error[0] : anyData.error)) ||
        (anyData.non_field_errors && anyData.non_field_errors[0]) ||
        (Object.values(anyData)[0] && Array.isArray(Object.values(anyData)[0]) ? (Object.values(anyData)[0] as any)[0] : Object.values(anyData)[0]) ||
        'Failed to reset password';
      throw new Error(errorMessage);
    }

    const responseData = await response.json().catch(() => ({}));
    if (responseData.error) {
      const errorMessage = Array.isArray(responseData.error) ? responseData.error[0] : responseData.error;
      throw new Error(errorMessage);
    }
    return responseData;
  },

  // Switch user role
  async switchRole(token: string): Promise<{ message: string, user: AuthResponse['user'] }> {
    const response = await fetch(`${API_BASE_URL}/auth/switch-role/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to switch role');
    }

    return response.json();
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get passenger ride history
  async getPassengerRides(token: string) {
    const response = await fetch(`${API_BASE_URL}/rides/passenger/history/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ride history');
    }

    return response.json();
  },

  // Get driver ride requests
  async getDriverRideRequests(token: string) {
    const response = await fetch(`${API_BASE_URL}/rides/driver/requests/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ride requests');
    }

    return response.json();
  },

  // Get driver earnings
  async getDriverEarnings(token: string) {
    const response = await fetch(`${API_BASE_URL}/rides/driver/earnings/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch earnings');
    }

    return response.json();
  },

  // Accept ride request
  async acceptRideRequest(token: string, rideId: number) {
    const response = await fetch(`${API_BASE_URL}/rides/driver/accept/${rideId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to accept ride request');
    }

    return response.json();
  },

  // Decline ride request
  async declineRideRequest(token: string, rideId: number) {
    const response = await fetch(`${API_BASE_URL}/rides/driver/decline/${rideId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to decline ride request');
    }

    return response.json();
  },
};

// Ride booking API functions
export const rideBookingAPI = {
  // Estimate ride fare
  async estimateRide(token: string, bookingData: {
    pickup_location: string;
    destination: string;
    pickup_time?: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/rides/estimate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error('Failed to estimate ride');
    }

    return response.json();
  },

  // Book a ride
  async bookRide(token: string, bookingData: {
    pickup_location: string;
    destination: string;
    pickup_time?: string;
    notes?: string;
    estimated_fare: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/rides/book/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error('Failed to book ride');
    }

    return response.json();
  },

  // Get active rides for passenger
  async getActiveRides(token: string) {
    const response = await fetch(`${API_BASE_URL}/rides/passenger/active/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active rides');
    }

    return response.json();
  },

  // Cancel a ride
  async cancelRide(token: string, rideId: number) {
    const response = await fetch(`${API_BASE_URL}/rides/passenger/cancel/${rideId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel ride');
    }

    return response.json();
  },
};

//Get rides
export const getAllRides = async () => {
  const res = await fetch(`${API_BASE_URL}/rides/`)
  return res.json();
}

export const getMyRides = async () => {
  const res = await fetch(`${API_BASE_URL}/rides/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return res.json();
}

// Payment API functions
export const paymentAPI = {
  // Initiate M-Pesa payment
  async initiateMpesaPayment(token: string, data: { phone_number: string; amount: number; booking_id?: number }) {
    const response = await fetch(`${API_BASE_URL}/payments/wallet/topup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: data.phone_number,  // Changed from phone_number to phone
        amount: data.amount,
        booking_id: data.booking_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail ||
        errorData.error ||
        `Failed to initiate M-Pesa payment (${response.status})`;
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get wallet balance
  async getWalletBalance(token: string) {
    const response = await fetch(`${API_BASE_URL}/payments/wallet/balance/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch wallet balance');
    }

    return response.json();
  },

  // Get wallet transactions
  async getWalletTransactions(token: string, page: number = 1, pageSize: number = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/payments/wallet/transactions/?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch wallet transactions');
    }

    return response.json();
  },
};

// Admin API functions
export const adminAPI = {
  async getStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/admin/stats/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch admin statistics');
    return response.json();
  },

  async getUsers(token: string, userType?: 'driver' | 'passenger') {
    const url = new URL(`${API_BASE_URL}/admin/users/`);
    if (userType) url.searchParams.append('user_type', userType);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getTransactions(token: string) {
    const response = await fetch(`${API_BASE_URL}/admin/transactions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  async getMpesaStatus(token: string, transactionId: number) {
    const response = await fetch(`${API_BASE_URL}/admin/mpesa/status/${transactionId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch M-Pesa status');
    return response.json();
  },

  async initiateReversal(token: string, transactionId: number, amount: number, reason: string) {
    const response = await fetch(`${API_BASE_URL}/admin/mpesa/reversal/${transactionId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, reason }),
    });
    if (!response.ok) throw new Error('Failed to initiate reversal');
    return response.json();
  },

  async getMpesaBalance(token: string) {
    const response = await fetch(`${API_BASE_URL}/admin/mpesa/balance/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch M-Pesa balance');
    return response.json();
  },
};
