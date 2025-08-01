'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface RideBooking {
  pickup_location: string;
  destination: string;
  estimated_fare: number;
  estimated_time: string;
  distance: string;
}

const SIDEBAR_ITEMS = [
  { key: 'find', label: 'Find a ride' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' },
];

export default function PassengerDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeSidebar, setActiveSidebar] = useState('find');
  const [bookingData, setBookingData] = useState({
    pickup_location: '',
    destination: '',
    pickup_time: '',
    notes: ''
  });
  const [estimatedRide, setEstimatedRide] = useState<RideBooking | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleBookingChange = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const estimateRide = async () => {
    if (!bookingData.pickup_location || !bookingData.destination) {
      return;
    }
    setIsEstimating(true);
    setTimeout(() => {
      setEstimatedRide({
        pickup_location: bookingData.pickup_location,
        destination: bookingData.destination,
        estimated_fare: Math.floor(Math.random() * 50) + 15,
        estimated_time: `${Math.floor(Math.random() * 30) + 10} min`,
        distance: `${(Math.random() * 20 + 5).toFixed(1)} km`
      });
      setIsEstimating(false);
    }, 1500);
  };

  const bookRide = async () => {
    if (!estimatedRide) return;
    setTimeout(() => {
      alert('Ride booked successfully! A driver will be assigned shortly.');
      setBookingData({
        pickup_location: '',
        destination: '',
        pickup_time: '',
        notes: ''
      });
      setEstimatedRide(null);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) return null;

  // Avatar initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-8 px-4 min-h-screen">
        <div className="mb-10 flex items-center space-x-3">
          <span className="text-2xl font-bold text-blue-600">Travas</span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {SIDEBAR_ITEMS.map(item => (
              <li key={item.key}>
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeSidebar === item.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                  onClick={() => setActiveSidebar(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="flex justify-between items-center h-20 px-8 bg-white border-b relative">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">{user.first_name} {user.last_name}</span>
            <div className="relative" ref={dropdownRef}>
              <button
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg focus:outline-none"
                onClick={() => setDropdownOpen(v => !v)}
                aria-label="User menu"
              >
                {getInitials(user.first_name + ' ' + user.last_name)}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveSidebar('profile');
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout && logout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-8">
          {activeSidebar === 'find' && (
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Find a Ride</h2>
                <p className="text-gray-600 mt-1">Enter your pickup and destination to find available rides</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      value={bookingData.pickup_location}
                      onChange={(e) => handleBookingChange('pickup_location', e.target.value)}
                      placeholder="Enter pickup address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={bookingData.destination}
                      onChange={(e) => handleBookingChange('destination', e.target.value)}
                      placeholder="Enter destination address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingData.pickup_time}
                      onChange={(e) => handleBookingChange('pickup_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) => handleBookingChange('notes', e.target.value)}
                      placeholder="Any special instructions for the driver"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={estimateRide}
                    disabled={!bookingData.pickup_location || !bookingData.destination || isEstimating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEstimating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Estimating...
                      </div>
                    ) : (
                      'Estimate Ride'
                    )}
                  </button>
                </div>
                {estimatedRide && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ride Estimate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Estimated Fare</p>
                        <p className="text-2xl font-bold text-blue-600">${estimatedRide.estimated_fare.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Time</p>
                        <p className="text-lg font-semibold text-gray-900">{estimatedRide.estimated_time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Distance</p>
                        <p className="text-lg font-semibold text-gray-900">{estimatedRide.distance}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>From:</strong> {estimatedRide.pickup_location}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>To:</strong> {estimatedRide.destination}
                          </p>
                        </div>
                        <button
                          onClick={bookRide}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Placeholder for other sidebar items */}
          {activeSidebar !== 'find' && (
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border flex items-center justify-center min-h-[400px] text-gray-400 text-lg font-medium">
              {SIDEBAR_ITEMS.find(i => i.key === activeSidebar)?.label} coming soon...
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 