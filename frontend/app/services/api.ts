const API_BASE_URL = 'http://localhost:8000/api';

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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
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