'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  DollarSign,
  Filter,
  Search,
  Plus,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
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
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const statusConfig = {
    active: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: TrendingUp,
      label: 'Active'
    },
    completed: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Completed'
    },
    cancelled: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      label: 'Cancelled'
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesFilter = filter === 'all' || ride.status === filter;
    const matchesSearch = ride.departure_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ride.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: rides.length,
    active: rides.filter(r => r.status === 'active').length,
    completed: rides.filter(r => r.status === 'completed').length,
    totalEarnings: rides.reduce((sum, r) => sum + Number(r.price || 0), 0)
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#08A6F6]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md">
          <AlertCircle className="w-6 h-6 mb-2" />
          <p className="font-semibold">Error Loading Rides</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Rides</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track your ride listings</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/driver')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create New Ride</span>
          <span className="sm:hidden">New Ride</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-gray-600">Total Rides</p>
            <Car className="w-4 h-4 md:w-5 md:h-5 text-[#08A6F6]" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-gray-600">Active</p>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#08A6F6]" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#08A6F6]">{stats.active}</p>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-gray-600">Completed</p>
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-gray-600">Total Earnings</p>
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-[#08A6F6]" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(0)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'active', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rides List */}
      {filteredRides.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No rides found</h3>
          <p className="text-gray-600 mb-6">
            {rides.length === 0 
              ? "Get started by creating your first ride listing" 
              : searchQuery 
                ? 'Try adjusting your search' 
                : 'No rides match the selected filter'}
          </p>
          {rides.length === 0 && (
            <button
              onClick={() => router.push('/dashboard/driver')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ride
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRides.map((ride) => {
            const status = ride.status as keyof typeof statusConfig;
            const StatusIcon = statusConfig[status]?.icon || AlertCircle;
            
            return (
              <div 
                key={ride.id} 
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                <div className="p-5">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      statusConfig[status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig[status]?.label || ride.status}
                    </span>
                    <span className="text-xl font-bold text-[#08A6F6]">
                      ${Number(ride.price).toFixed(0)}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{ride.departure_location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">To</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{ride.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs">{format(new Date(ride.departure_time), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs">{format(new Date(ride.departure_time), 'h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs">{ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} available</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {ride.status === 'active' && (
                    <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all">
                      View Details
                    </button>
                  )}

                  {ride.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Completed on</span>
                        <span className="font-medium">{format(new Date(ride.created_at), 'MMM dd')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Page;