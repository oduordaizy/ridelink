'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { IoWallet, IoCard } from "react-icons/io5";
import { FaCar, FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaSpinner, FaChevronDown, FaChevronUp, FaUser, FaStar, FaPhone, FaInfoCircle, FaClock, FaImage } from "react-icons/fa";
import { FaMoneyBillWave as IoCash } from "react-icons/fa";
import { paymentAPI, API_BASE_URL } from '@/app/services/api';
import toast, { Toaster } from 'react-hot-toast';

interface Ride {
  id: number;
  departure_location: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price: number;
  additional_info?: string;
  driver: {
    username: string;
    phone_number?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    driver_profile?: {
      vehicle_model?: string;
      vehicle_color?: string;
      vehicle_plate?: string;
      vehicle_picture?: string;
      rating?: number;
    };
  };
  is_paid?: boolean;
  driver_phone?: string;
}

type PaymentMethod = 'wallet' | 'mpesa' | 'card';

const Page = () => {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [showMpesaForm, setShowMpesaForm] = useState(false);
  const [searchParams, setSearchParams] = useState({
    departure: '',
    destination: '',
    date: ''
  });
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);

  // Fetch all rides (initial load and after clearing search)
  const fetchAllRides = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/rides/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('All rides data:', data);

      // Sort rides by departure time (soonest first)
      const sortedRides = data.sort((a: Ride, b: Ride) => {
        return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      });

      setRides(sortedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      alert('Failed to load rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search rides based on search parameters
  const searchRides = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/rides/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      console.log('All rides data:', data);

      // Filter rides based on search parameters
      if (searchParams.departure?.trim() || searchParams.destination?.trim() || searchParams.date) {
        const departureTerm = searchParams.departure?.trim().toLowerCase() || '';
        const destinationTerm = searchParams.destination?.trim().toLowerCase() || '';
        const dateTerm = searchParams.date ? new Date(searchParams.date).toISOString().split('T')[0] : '';

        console.log('Filtering with:', { departureTerm, destinationTerm, dateTerm });

        data = data.filter((ride: Ride) => {
          const matchesDeparture = !departureTerm ||
            ride.departure_location.toLowerCase().includes(departureTerm);
          const matchesDestination = !destinationTerm ||
            ride.destination.toLowerCase().includes(destinationTerm);
          const matchesDate = !dateTerm ||
            new Date(ride.departure_time).toISOString().split('T')[0] === dateTerm;

          return matchesDeparture && matchesDestination && matchesDate;
        });
      }

      // Sort rides by departure time (soonest first)
      const sortedRides = data.sort((a: Ride, b: Ride) => {
        return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      });

      setRides(sortedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      alert('Failed to load rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchAllRides();
      fetchWalletBalance();
    }
  }, [user, isLoading, router, fetchAllRides]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await paymentAPI.getWalletBalance(token);
        // Handle both possible response structures
        const balance = response.data?.balance ?? response.balance;
        setWalletBalance(Number(balance));
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search submitted with params:', searchParams);
    searchRides();
  };

  const clearSearch = () => {
    setSearchParams({
      departure: '',
      destination: '',
      date: ''
    });
    // Fetch all rides when clearing search
    fetchAllRides();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handlePaymentSelection = async (method: PaymentMethod) => {
    if (!selectedRide) return;

    if (method === 'mpesa') {
      setShowMpesaForm(true);
      setMpesaAmount(selectedRide.price.toString());
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to make a payment');
      return;
    }

    setIsProcessingPayment(true);

    try {
      if (method === 'wallet') {
        // Book ride with wallet payment
        const response = await fetch(`${API_BASE_URL}/rides/${selectedRide.id}/book/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_method: 'wallet',
            no_of_seats: 1
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Booking failed');
        }

        const data = await response.json();

        // Show success message with driver contact
        alert(`Booking confirmed! Driver contact: ${data.driver_phone}`);

        // Update wallet balance
        if (walletBalance !== null) {
          setWalletBalance(walletBalance - selectedRide.price);
        }

        // Refresh rides list
        fetchAllRides();

      } else if (method === 'card') {
        // Book ride with card payment
        const response = await fetch(`${API_BASE_URL}/rides/${selectedRide.id}/book/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_method: 'card',
            no_of_seats: 1
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Booking failed');
        }

        const data = await response.json();
        toast.success(`Booking created! Booking ID: ${data.booking_id}. Please complete card payment.`, {
          duration: 5000,
        });

        // Refresh rides list
        fetchAllRides();
      }

    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setSelectedRide(null);
    }
  };

  const processMpesaPayment = async () => {
    if (!selectedRide || !mpesaPhone || !mpesaAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to make a payment');
      return;
    }

    // Format phone number to include country code if not present
    let formattedPhone = mpesaPhone.trim();
    if (!formattedPhone.startsWith('254') && formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254') && !formattedPhone.startsWith('+254')) {
      formattedPhone = '254' + formattedPhone;
    }

    setIsProcessingPayment(true);

    try {
      // First, create the booking
      const bookingResponse = await fetch(`${API_BASE_URL}/rides/${selectedRide.id}/book/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: 'mpesa',
          no_of_seats: 1
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Booking failed');
      }

      const bookingData = await bookingResponse.json();
      console.log('Booking created:', bookingData);

      // Then initiate M-Pesa payment
      const paymentData = await paymentAPI.initiateMpesaPayment(token, {
        phone_number: formattedPhone,
        amount: parseFloat(mpesaAmount)
      });

      console.log('M-Pesa payment initiated:', paymentData);

      // Show success message
      toast.success('Payment initiated! Please check your phone to complete the M-Pesa payment.', {
        duration: 6000,
      });
      toast('Your booking will be confirmed once payment is received.', {
        duration: 6000,
        icon: 'ℹ️',
      });
      setShowMpesaForm(false);
      setShowPaymentModal(false);
      setMpesaPhone('');
      setMpesaAmount('');
      setSelectedRide(null);

      // Refresh available rides
      fetchAllRides();

    } catch (error) {
      console.error('M-Pesa payment failed:', error);

      // More detailed error messages based on error type
      let errorMessage = 'M-Pesa payment failed. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. Please check the phone number and amount.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const bookRide = async (rideId: number, paymentMethod: string, token: string) => {
    try {
      // Book the ride
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/book/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book ride');
      }

      // Update the ride's available seats and status
      const updatedRide = await response.json();
      setRides(prevRides =>
        prevRides.map(ride =>
          ride.id === rideId ? { ...ride, ...updatedRide } : ride
        )
      );

      return updatedRide;
    } catch (error) {
      console.error('Error booking ride:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 5000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Payment Modal */}
      {showPaymentModal && selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedRide(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4">Complete Your Booking</h3>
            <div className="mb-6">
              <p className="text-gray-600">From: <span className="font-medium">{selectedRide.departure_location}</span></p>
              <p className="text-gray-600">To: <span className="font-medium">{selectedRide.destination}</span></p>
              <p className="text-gray-600">Price: <span className="font-bold text-primary">KSh {selectedRide.price}</span></p>
            </div>

            <div className="space-y-3">
              {showMpesaForm ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="mpesa-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      id="mpesa-phone"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="e.g., 254712345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isProcessingPayment}
                    />
                  </div>
                  <div>
                    <label htmlFor="mpesa-amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (KSh)
                    </label>
                    <input
                      type="number"
                      id="mpesa-amount"
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isProcessingPayment}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={processMpesaPayment}
                      disabled={isProcessingPayment || !mpesaPhone || !mpesaAmount}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium ${isProcessingPayment || !mpesaPhone || !mpesaAmount
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {isProcessingPayment ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </span>
                      ) : (
                        'Pay with M-Pesa'
                      )}
                    </button>
                    <button
                      onClick={() => setShowMpesaForm(false)}
                      disabled={isProcessingPayment}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handlePaymentSelection('wallet')}
                    disabled={isProcessingPayment || (walletBalance !== null && walletBalance < (selectedRide?.price || 0))}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${isProcessingPayment || (walletBalance !== null && walletBalance < (selectedRide?.price || 0))
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center">
                      {isProcessingPayment ? (
                        <FaSpinner className="animate-spin text-primary text-xl mr-3" />
                      ) : (
                        <IoWallet className="text-primary text-xl mr-3" />
                      )}
                      <div className="text-left">
                        <div>Pay with Wallet</div>
                        {walletBalance !== null && (
                          <div className="text-xs text-gray-500">Balance: KSh {walletBalance.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => handlePaymentSelection('mpesa')}
                    disabled={isProcessingPayment}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${isProcessingPayment ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center">
                      <IoCash className="text-green-600 text-xl mr-3" />
                      <span>Pay with M-Pesa</span>
                    </div>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => handlePaymentSelection('card')}
                    disabled={isProcessingPayment}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${isProcessingPayment ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center">
                      <IoCard className="text-blue-600 text-xl mr-3" />
                      <span>Pay with Card</span>
                    </div>
                    <span>→</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Search */}
      <section className="px-4 py-8 text-center bg-blue-50">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Find your perfect ride</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">Search, book, and travel with trusted drivers around you</p>

        {/* Search Form */}
        <div className="mt-10 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="departure"
                value={searchParams.departure}
                onChange={handleInputChange}
                placeholder="From"
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="destination"
                value={searchParams.destination}
                onChange={handleInputChange}
                placeholder="To"
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="date"
                value={searchParams.date}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex-1 flex items-center justify-center"
              >
                <FaSearch className="mr-2" />
                Search
              </button>
              {(searchParams.departure || searchParams.destination || searchParams.date) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Available Rides Section */}
      <section className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Available Rides</h2>
        </div>

        {/* Rides List */}
        <div className="grid grid-cols-1 gap-4">
          {rides.length === 0 ? (
            <div className="text-center py-12">
              <FaCar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No rides found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or check back later.</p>
            </div>
          ) : (
            rides.map((ride) => {
              const isExpanded = expandedRideId === ride.id;
              const departureDate = new Date(ride.departure_time);

              return (
                <div
                  key={ride.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Card Header - Always Visible */}
                  <div
                    onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Driver Info */}
                        <div className="flex items-center gap-3 mb-4">
                          {ride.driver.profile_picture ? (
                            <img
                              src={ride.driver.profile_picture}
                              alt={ride.driver.username}
                              className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-blue-500"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                              <FaUser className="text-white text-lg" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {ride.driver.first_name || ride.driver.username}'s Ride
                            </h3>
                            <p className="text-sm text-gray-500">@{ride.driver.username}</p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="space-y-2 ml-1">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                            <p className="text-gray-800 font-medium">{ride.departure_location}</p>
                          </div>
                          <div className="border-l-2 border-gray-300 h-8 ml-1.5"></div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                            <p className="text-gray-800 font-medium">{ride.destination}</p>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-blue-500" />
                            <span>{departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCar className="text-blue-500" />
                            <span className={ride.available_seats > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                              {ride.available_seats > 0 ? `${ride.available_seats} seat${ride.available_seats !== 1 ? 's' : ''} left` : 'Fully booked'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Expand Icon */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">KSh {Number(ride.price).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">per seat</div>
                        </div>
                        <div className="mt-2">
                          {isExpanded ? (
                            <FaChevronUp className="text-gray-400" />
                          ) : (
                            <FaChevronDown className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
                      <div className="pt-4 space-y-4">
                        {/* Detailed Ride Info */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaInfoCircle className="text-blue-500" />
                            Ride Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Departure Time:</span>
                              <span className="font-medium text-gray-900">
                                {departureDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Available Seats:</span>
                              <span className="font-medium text-gray-900">{ride.available_seats}</span>
                            </div>
                            {ride.additional_info && (
                              <div className="pt-2 border-t border-gray-100">
                                <span className="text-gray-600">Additional Info:</span>
                                <p className="text-gray-900 mt-1">{ride.additional_info}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Driver Info */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaUser className="text-blue-500" />
                            Driver Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium text-gray-900">
                                {ride.driver.first_name && ride.driver.last_name
                                  ? `${ride.driver.first_name} ${ride.driver.last_name}`
                                  : ride.driver.username}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Username:</span>
                              <span className="font-medium text-gray-900">@{ride.driver.username}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 flex items-center gap-1">
                                <FaPhone className="text-sm" />
                                Contact:
                              </span>
                              {ride.is_paid && ride.driver_phone ? (
                                <span className="font-medium text-gray-900">{ride.driver_phone}</span>
                              ) : (
                                <span className="text-gray-500 italic text-xs bg-gray-100 px-2 py-1 rounded">Hidden until booking confirmed</span>
                              )}
                            </div>
                            {ride.driver.driver_profile?.rating !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center gap-1">
                                  <FaStar className="text-sm text-yellow-500" />
                                  Rating:
                                </span>
                                <span className="font-medium text-gray-900">{Number(ride.driver.driver_profile.rating).toFixed(1)} / 5.0</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Vehicle Info */}
                        {ride.driver.driver_profile && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FaCar className="text-blue-500" />
                              Vehicle Information
                            </h4>
                            <div className="space-y-3">
                              {ride.driver.driver_profile.vehicle_picture && (
                                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={ride.driver.driver_profile.vehicle_picture}
                                    alt="Vehicle"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {ride.driver.driver_profile.vehicle_model && (
                                  <div>
                                    <span className="text-gray-600">Model:</span>
                                    <p className="font-medium text-gray-900">{ride.driver.driver_profile.vehicle_model}</p>
                                  </div>
                                )}
                                {ride.driver.driver_profile.vehicle_color && (
                                  <div>
                                    <span className="text-gray-600">Color:</span>
                                    <p className="font-medium text-gray-900">{ride.driver.driver_profile.vehicle_color}</p>
                                  </div>
                                )}
                                {ride.driver.driver_profile.vehicle_plate && (
                                  <div className="col-span-2">
                                    <span className="text-gray-600">Plate Number:</span>
                                    <p className="font-medium text-gray-900 text-lg tracking-wider">{ride.driver.driver_profile.vehicle_plate}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="px-5 pb-5">
                    {ride.is_paid ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          Booking confirmed
                        </p>
                        {ride.driver_phone && (
                          <p className="text-sm text-green-600 mt-1">
                            Driver contact: {ride.driver_phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRide(ride);
                          setShowPaymentModal(true);
                        }}
                        disabled={ride.available_seats <= 0}
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${ride.available_seats > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {ride.available_seats > 0 ? 'Book Now' : 'Fully Booked'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;