'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  FaCar, FaCalendarAlt, FaUserFriends, FaUser 
} from 'react-icons/fa'
import { format } from 'date-fns'

interface Ride {
  id: number;
  departure_location: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price: number | string;
  status: string;
  created_at: string;
  driver_name?: string;
  driver_phone?: string;
  is_paid?: boolean;
}

const Page = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        if (!user) return;
        
        const response = await fetch(`http://127.0.0.1:8000/api/rides/?driver=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rides');
        }

        const data = await response.json();
        const sortedRides = data.sort((a: Ride, b: Ride) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRides(sortedRides);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#005792' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#00204a' }}>My Rides</h1>
          <button
            onClick={() => router.push('/dashboard/driver')}
            className="px-4 py-2 rounded-lg text-white shadow"
            style={{ backgroundColor: '#005792' }}
          >
            + Create New Ride
          </button>
        </div>

        {rides.length === 0 ? (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <FaCar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No rides yet</h3>
            <p className="text-gray-500">Get started by creating your first ride.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride) => (
              <div 
                key={ride.id} 
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold" style={{ color: '#005792' }}>
                      {ride.departure_location} → {ride.destination}
                    </h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                      ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ride.status}
                    </span>
                  </div>

                  {/* Driver Name */}
                  {ride.driver_name && (
                    <p className="flex items-center text-sm text-gray-600 mb-2">
                      <FaUser className="mr-2 text-gray-400" />
                      {ride.driver_name}
                    </p>
                  )}

                  {/* Ride Details */}
                  <p className="flex items-center text-sm text-gray-600 mb-2">
                    <FaCalendarAlt className="mr-2 text-gray-400" />
                    {format(new Date(ride.departure_time), 'PPpp')}
                  </p>
                  <p className="flex items-center text-sm text-gray-600 mb-2">
                    <FaUserFriends className="mr-2 text-gray-400" />
                    {ride.available_seats} seat(s) available
                  </p>
                  <p className="flex items-center text-sm text-gray-600 mb-4">
                    {/* <FaMoneyBillWave className="mr-2 text-gray-400" /> */}
                    ${Number(ride.price).toFixed(2)}
                  </p>
                </div>

                {/* Locked/Unlocked phone number */}
                {/* <div className="border-t pt-3">
                  <p className="text-sm font-semibold" style={{ color: '#005792' }}>
                    📞 {ride.driver_phone}
                  </p>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
