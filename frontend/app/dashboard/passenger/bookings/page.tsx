'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaClock, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import { API_BASE_URL } from '@/app/services/api';

interface Booking {
  id: number;
  ride: number;
  ride_details?: {
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
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
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
      console.log('Fetching bookings...');
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bookings data received:', data);
        setBookings(data);
      } else {
        const text = await response.text();
        console.error('Failed to fetch bookings:', response.status, text);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      (booking.ride_details?.departure_location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (booking.ride_details?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (booking.ride_details?.driver?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#C0DFED] rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#08A6F6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-[#484848] font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #08A6F6 0%, #00204a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.05)'
        }}></div>
        <div style={{ position: 'relative', padding: '3rem 1.5rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  marginBottom: '0.5rem'
                }}>My Bookings</h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.125rem'
                }}>View and manage your ride bookings</p>
              </div>
              <Link
                href="/dashboard/passenger"
                style={{
                  background: '#FFFFFF',
                  color: '#08A6F6',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FaSearch style={{ width: '1.25rem', height: '1.25rem' }} />
                Find a Ride
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Filters */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6b7280'
              }}>
                <FaSearch style={{ height: '1.25rem', width: '1.25rem' }} />
              </div>
              <input
                type="text"
                placeholder="Search by location or driver"
                style={{
                  paddingLeft: '3rem',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.875rem',
                  border: '2px solid #e5e7eb',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.currentTarget.style.borderColor = '#08A6F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <select
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.875rem',
                  border: '2px solid #e5e7eb',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  color: '#374151',
                  fontWeight: '500'
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                onFocus={(e) => e.currentTarget.style.borderColor = '#08A6F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                onClick={fetchBookings}
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #e5e7eb',
                  color: '#374151',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.875rem',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#08A6F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.25rem', width: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '5rem',
                height: '5rem',
                background: 'linear-gradient(135deg, rgba(8, 166, 246, 0.1) 0%, rgba(0, 32, 74, 0.1) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <FaCar style={{ height: '2.5rem', width: '2.5rem', color: '#08A6F6' }} />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#00204a',
                marginBottom: '0.5rem'
              }}>No bookings found</h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>You haven&apos;t made any bookings yet or no matches found.</p>
              <Link
                href="/dashboard/passenger"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  borderRadius: '1rem',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #08A6F6 0%, #00204a 100%)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(8, 166, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(8, 166, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(8, 166, 246, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FaSearch />
                Find a Ride
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={cancelBooking}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: number) => void }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
          alignItems: window.innerWidth < 1024 ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#00204a'
              }}>
                {booking.ride_details?.departure_location || 'Unknown'} → {booking.ride_details?.destination || 'Unknown'}
              </h3>
              <span style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '0.75rem'
              }}
                className={statusColors[booking.status].split(' ').join(' ')}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              {booking.is_paid && (
                <span style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  background: '#dcfce7',
                  color: '#16a34a',
                  border: '1px solid #86efac'
                }}>
                  ✓ Paid
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 640 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <InfoItem icon={<FaCalendarAlt />} label="Date" value={booking.ride_details?.departure_time ? new Date(booking.ride_details.departure_time).toLocaleDateString() : 'N/A'} />
              <InfoItem icon={<FaClock />} label="Time" value={booking.ride_details?.departure_time ? new Date(booking.ride_details.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} />
              <InfoItem icon={<FaUser />} label="Driver" value={booking.ride_details?.driver?.username || 'Unknown'} />
              <InfoItem icon={<FaMapMarkerAlt />} label="Seats" value={`${booking.no_of_seats} seat${booking.no_of_seats !== 1 ? 's' : ''}`} />
              <InfoItem icon={<FaMoneyBillWave />} label="Total" value={`KSh ${booking.total_price.toLocaleString()}`} />
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'row' : window.innerWidth < 1024 ? 'row' : 'column',
            gap: '0.5rem',
            width: window.innerWidth < 1024 ? '100%' : 'auto'
          }}>
            {booking.status === 'pending' && (
              <button
                onClick={() => onCancel(booking.id)}
                style={{
                  padding: '0.875rem 1.25rem',
                  border: '2px solid #ef4444',
                  color: '#dc2626',
                  borderRadius: '0.875rem',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Cancel
              </button>
            )}
            <Link
              href={`/dashboard/passenger/bookings/${booking.id}`}
              style={{
                padding: '0.875rem 1.25rem',
                background: 'linear-gradient(135deg, #08A6F6 0%, #00204a 100%)',
                color: '#FFFFFF',
                borderRadius: '0.875rem',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(8, 166, 246, 0.3)',
                textDecoration: 'none',
                display: 'block',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(8, 166, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(8, 166, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(90deg, #f9fafb 0%, #FFFFFF 100%)',
        padding: '0.875rem 1.5rem',
        fontSize: '0.75rem',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        fontWeight: '500'
      }}>
        Booking ID: #{booking.id} • Created: {new Date(booking.created_at).toLocaleString()}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#374151' }}>
      <div style={{
        width: '2.5rem',
        height: '2.5rem',
        background: 'linear-gradient(135deg, rgba(8, 166, 246, 0.1) 0%, rgba(0, 32, 74, 0.1) 100%)',
        borderRadius: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#08A6F6'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{label}</p>
        <p style={{ fontWeight: '600' }}>{value}</p>
      </div>
    </div>
  );
}