'use client';
import { useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaClock, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import PassengerNavbar from '@/app/components/PassengerNavbar';
import { API_BASE_URL } from '@/app/services/api';


interface Booking {
  id: number;
  ride: {
    id: number;
    departure_location: string;
    destination: string;
    departure_time: string;
    price: number;
    driver: {
      username: string;
    };
  };
  no_of_seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function BookingsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchBookings();
    }
  }, [user, isLoading, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.ride.departure_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.ride.driver.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const cancelBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh bookings after cancellation
          fetchBookings();
        } else {
          const errorData = await response.json();
          alert(errorData.detail || 'Failed to cancel booking');
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('An error occurred while cancelling the booking');
      }
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PassengerNavbar 
        user={{
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email
        }} 
        onLogout={logout} 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-1 text-gray-600">View and manage your ride bookings</p>
            </div>
            <Link 
              href="/dashboard/passenger"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Find a Ride
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by location or driver"
                  className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={fetchBookings}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FaCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                <p className="mt-1 text-gray-500">You haven&apos;t made any bookings yet.</p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/passenger"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Find a Ride
                  </Link>
                </div>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.ride.departure_location} → {booking.ride.destination}
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.is_paid && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            <span>{new Date(booking.ride.departure_time).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <FaClock className="mr-2 text-gray-400" />
                            <span>{new Date(booking.ride.departure_time).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center">
                            <FaUser className="mr-2 text-gray-400" />
                            <span>Driver: {booking.ride.driver.username}</span>
                          </div>
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                            <span>{booking.no_of_seats} seat{booking.no_of_seats !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <FaMoneyBillWave className="mr-2 text-gray-400" />
                            <span>KSh {booking.total_price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            Cancel Booking
                          </button>
                        )}
                        <Link
                          href={`/dashboard/passenger/bookings/${booking.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t border-gray-200">
                    Booking ID: {booking.id} • Created: {new Date(booking.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}