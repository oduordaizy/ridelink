'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface RideRequest {
  id: number;
  passenger_name: string;
  pickup_location: string;
  destination: string;
  fare: number;
  distance: string;
  estimated_time: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  created_at: string;
}

interface Earnings {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
}

export default function DriverDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({
    today: 0,
    this_week: 0,
    this_month: 0,
    total: 0
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isLoadingRides, setIsLoadingRides] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Simulate loading ride requests and earnings
    setIsLoadingRides(true);
    setTimeout(() => {
      setRideRequests([
        {
          id: 1,
          passenger_name: 'Alice Johnson',
          pickup_location: 'Downtown Mall',
          destination: 'Airport Terminal 1',
          fare: 45.50,
          distance: '12.5 km',
          estimated_time: '25 min',
          status: 'pending',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          passenger_name: 'Bob Smith',
          pickup_location: 'Central Station',
          destination: 'University Campus',
          fare: 22.00,
          distance: '8.2 km',
          estimated_time: '18 min',
          status: 'accepted',
          created_at: '2024-01-15T09:15:00Z'
        },
        {
          id: 3,
          passenger_name: 'Carol Davis',
          pickup_location: 'Shopping Center',
          destination: 'Home',
          fare: 18.75,
          distance: '6.8 km',
          estimated_time: '15 min',
          status: 'completed',
          created_at: '2024-01-15T08:45:00Z'
        }
      ]);

      setEarnings({
        today: 86.25,
        this_week: 342.50,
        this_month: 1247.80,
        total: 5678.90
      });

      setIsLoadingRides(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleAcceptRide = (rideId: number) => {
    setRideRequests(prev => 
      prev.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: 'accepted' as const }
          : ride
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.first_name}!</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-md ${
                isOnline 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Quick Actions (vertical stack) */}
        <section className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border flex flex-col items-start">
            <div className="flex items-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Rides</h3>
                <p className="text-gray-600 text-sm">Manage current rides</p>
              </div>
            </div>
            <button className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View Active
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border flex flex-col items-start">
            <div className="flex items-center mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
                <p className="text-gray-600 text-sm">View your earnings</p>
              </div>
            </div>
            <button className="w-full mt-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
              View Earnings
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border flex flex-col items-start">
            <div className="flex items-center mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vehicle</h3>
                <p className="text-gray-600 text-sm">Manage vehicle info</p>
              </div>
            </div>
            <button className="w-full mt-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Edit Vehicle
            </button>
          </div>
        </section>

        {/* Right: Stats and Ride Requests */}
        <section className="col-span-2 flex flex-col gap-10">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-2">
            <div className="bg-blue-50 rounded-2xl shadow p-6 flex flex-col items-start border-l-4 border-blue-500">
              <p className="text-sm text-blue-700 font-semibold mb-1">Today's Earnings</p>
              <p className="text-3xl font-bold text-blue-900 mb-1">${earnings.today.toFixed(2)}</p>
              <span className="text-xs text-blue-500">Updated just now</span>
            </div>
            <div className="bg-green-50 rounded-2xl shadow p-6 flex flex-col items-start border-l-4 border-green-500">
              <p className="text-sm text-green-700 font-semibold mb-1">This Week</p>
              <p className="text-3xl font-bold text-green-900 mb-1">${earnings.this_week.toFixed(2)}</p>
              <span className="text-xs text-green-500">Weekly total</span>
            </div>
            <div className="bg-yellow-50 rounded-2xl shadow p-6 flex flex-col items-start border-l-4 border-yellow-500">
              <p className="text-sm text-yellow-700 font-semibold mb-1">Rating</p>
              <p className="text-3xl font-bold text-yellow-900 mb-1">4.9</p>
              <span className="text-xs text-yellow-500">Your average rating</span>
            </div>
            <div className="bg-purple-50 rounded-2xl shadow p-6 flex flex-col items-start border-l-4 border-purple-500">
              <p className="text-sm text-purple-700 font-semibold mb-1">Total Rides</p>
              <p className="text-3xl font-bold text-purple-900 mb-1">156</p>
              <span className="text-xs text-purple-500">All time</span>
            </div>
          </div>

          {/* Ride Requests */}
          <div className="bg-white rounded-2xl shadow-lg border">
            <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Ride Requests</h2>
              <span className="text-sm text-gray-500">{rideRequests.length} requests</span>
            </div>
            <div className="p-8">
              {isLoadingRides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : rideRequests.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-lg">No ride requests at the moment.</div>
              ) : (
                <div className="space-y-6">
                  {rideRequests.map((ride) => (
                    <div key={ride.id} className="border border-gray-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-md transition-shadow">
                      <div className="flex-1 flex flex-col md:flex-row md:items-center md:space-x-8">
                        <div className="mb-2 md:mb-0">
                          <p className="font-semibold text-gray-900 text-lg">
                            {ride.pickup_location} <span className="text-blue-500">→</span> {ride.destination}
                          </p>
                          <p className="text-sm text-gray-500">
                            Passenger: <span className="font-medium text-gray-700">{ride.passenger_name}</span> • {ride.distance} • {ride.estimated_time}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(ride.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end">
                          <p className="font-semibold text-blue-700 text-xl mb-1">${ride.fare.toFixed(2)}</p>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                            {ride.status.replace('_', ' ').charAt(0).toUpperCase() + ride.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                      </div>
                      {ride.status === 'pending' && (
                        <div className="mt-4 md:mt-0 flex space-x-2">
                          <button
                            onClick={() => handleAcceptRide(ride.id)}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow"
                          >
                            Accept
                          </button>
                          <button className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 