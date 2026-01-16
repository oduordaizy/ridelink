'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/app/services/api';
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
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  X,
  User,
  Phone
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

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
  additional_info?: string;
}

interface Booking {
  id: number;
  user: {
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    phone_number?: string;
  };
  no_of_seats: number;
  status: string;
  booked_at: string;
}

const Page = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New state for View/Edit/Delete
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    departure_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    available_seats: 1,
    price: 0,
    additional_info: ''
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/rides/?driver=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rides');
        }

        const data = await response.json();
        const ridesList = Array.isArray(data) ? data : (data.results || []);
        const sortedRides = ridesList.sort((a: Ride, b: Ride) =>
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

  const fetchBookings = async (rideId: number) => {
    setFetchingBookings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/?ride=${rideId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const bookingsList = Array.isArray(data) ? data : (data.results || []);
        setBookings(bookingsList);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setFetchingBookings(false);
    }
  };

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride);
    setIsViewModalOpen(true);
    fetchBookings(ride.id);
  };

  const handleEditRide = (ride: Ride) => {
    setSelectedRide(ride);
    const departureDate = ride.departure_time.split('T')[0];
    const departureTime = ride.departure_time.split('T')[1].substring(0, 5);

    setEditFormData({
      departure_location: ride.departure_location,
      destination: ride.destination,
      departure_date: departureDate,
      departure_time: departureTime,
      available_seats: ride.available_seats,
      price: Number(ride.price),
      additional_info: ride.additional_info || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteRide = async (rideId: number) => {
    if (!window.confirm('Are you sure you want to delete this ride? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        toast.success('Ride deleted successfully');
        setRides(prev => prev.filter(r => r.id !== rideId));
        if (selectedRide?.id === rideId) {
          setIsViewModalOpen(false);
          setSelectedRide(null);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete ride');
      }
    } catch (err) {
      console.error('Error deleting ride:', err);
      toast.error('An error occurred while deleting the ride');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide) return;

    setIsUpdating(true);
    try {
      const departureDateTime = `${editFormData.departure_date}T${editFormData.departure_time}:00`;

      const payload = {
        departure_location: editFormData.departure_location,
        destination: editFormData.destination,
        departure_time: departureDateTime,
        available_seats: editFormData.available_seats,
        price: editFormData.price,
        additional_info: editFormData.additional_info
      };

      const response = await fetch(`${API_BASE_URL}/rides/${selectedRide.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedRide = await response.json();
        toast.success('Ride updated successfully');
        setRides(prev => prev.map(r => r.id === updatedRide.id ? updatedRide : r));
        setIsEditModalOpen(false);
        setSelectedRide(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update ride');
      }
    } catch (err) {
      console.error('Error updating ride:', err);
      toast.error('An error occurred while updating the ride');
    } finally {
      setIsUpdating(false);
    }
  };

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
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${filter === status
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
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewDetails(ride)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditRide(ride)}
                      className="p-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-[#08A6F6] hover:text-[#08A6F6] transition-all"
                      title="Edit Ride"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRide(ride.id)}
                      className="p-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-red-500 hover:text-red-500 transition-all"
                      title="Delete Ride"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

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

      {/* View Details Modal */}
      {isViewModalOpen && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white">
              <div>
                <h3 className="text-xl font-bold">Ride Details</h3>
                <p className="text-blue-100 text-xs mt-1">ID: #{selectedRide.id}</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Route & Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">From</p>
                      <p className="text-base font-semibold text-gray-900">{selectedRide.departure_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">To</p>
                      <p className="text-base font-semibold text-gray-900">{selectedRide.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Price</p>
                    <p className="text-lg font-bold text-[#08A6F6]">KSh {Number(selectedRide.price).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Seats</p>
                    <p className="text-lg font-bold text-gray-900">{selectedRide.available_seats}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Date</p>
                    <p className="text-sm font-semibold">{format(new Date(selectedRide.departure_time), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Time</p>
                    <p className="text-sm font-semibold">{format(new Date(selectedRide.departure_time), 'h:mm a')}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {selectedRide.additional_info && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-xs text-blue-700 font-bold uppercase mb-2">Additional Information</p>
                  <p className="text-sm text-blue-900">{selectedRide.additional_info}</p>
                </div>
              )}

              {/* Bookings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#08A6F6]" />
                    Passenger Bookings
                  </h4>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                    {bookings.length} Bookings
                  </span>
                </div>

                {fetchingBookings ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08A6F6]"></div>
                    <p className="text-sm text-gray-500">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No bookings yet</p>
                    <p className="text-xs text-gray-500 max-w-[200px]">Once passengers book seats, their details will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 rounded-xl border border-gray-100 hover:border-[#08A6F6] transition-colors bg-white shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 overflow-hidden">
                            {booking.user.profile_picture ? (
                              <img src={booking.user.profile_picture} alt={booking.user.username} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-[#08A6F6]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {booking.user.first_name} {booking.user.last_name || `@${booking.user.username}`}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                <Users className="w-3 h-3" /> {booking.no_of_seats} Seats
                              </span>
                              {booking.user.phone_number && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                  <Phone className="w-3 h-3" /> {booking.user.phone_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {booking.status}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">{format(new Date(booking.booked_at), 'MMM dd, HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditRide(selectedRide);
                }}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit Ride
              </button>
              <button
                onClick={() => handleDeleteRide(selectedRide.id)}
                className="py-3 px-6 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ride Modal */}
      {isEditModalOpen && selectedRide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Ride</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateRide} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</label>
                  <input
                    type="text"
                    required
                    value={editFormData.departure_location}
                    onChange={(e) => setEditFormData({ ...editFormData, departure_location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</label>
                  <input
                    type="text"
                    required
                    value={editFormData.destination}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.departure_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditFormData({ ...editFormData, departure_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    required
                    value={editFormData.departure_time}
                    onChange={(e) => setEditFormData({ ...editFormData, departure_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Seats</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={editFormData.available_seats}
                    onChange={(e) => setEditFormData({ ...editFormData, available_seats: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (KSh)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Info</label>
                <textarea
                  rows={3}
                  value={editFormData.additional_info}
                  onChange={(e) => setEditFormData({ ...editFormData, additional_info: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all resize-none"
                  placeholder="Any extra details for your passengers..."
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-4 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      Saving Changes...
                    </>
                  ) : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full py-3 bg-white text-gray-500 font-bold hover:text-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;