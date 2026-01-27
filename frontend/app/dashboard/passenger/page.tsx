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
  images: {
    id: number;
    image: string;
    created_at: string;
  }[];
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
  const [numberOfSeats, setNumberOfSeats] = useState(1);

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

      const ridesList = Array.isArray(data) ? data : (data.results || []);
      setRides(ridesList);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search rides based on search parameters
  const searchRides = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (searchParams.departure?.trim()) {
        queryParams.append('departure_location', searchParams.departure.trim());
      }
      if (searchParams.destination?.trim()) {
        queryParams.append('destination', searchParams.destination.trim());
      }
      if (searchParams.date) {
        // Backend expects ISO format. Since we want rides on/after this date:
        const date = new Date(searchParams.date);
        queryParams.append('date_after', date.toISOString());
        // If exact date match is preferred:
        // const nextDay = new Date(date);
        // nextDay.setDate(date.getDate() + 1);
        // queryParams.append('date_before', nextDay.toISOString());
      }

      const response = await fetch(`${API_BASE_URL}/rides/?${queryParams.toString()}`, {
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

      const dataRaw = await response.json();
      console.log('Search results:', dataRaw);

      const ridesList = Array.isArray(dataRaw) ? dataRaw : (dataRaw.results || []);
      setRides(ridesList);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides. Please try again later.');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  const handlePaymentSelection = async (method: PaymentMethod) => {
    if (!selectedRide) return;

    if (method === 'mpesa') {
      setShowMpesaForm(true);
      setMpesaAmount((selectedRide.price * numberOfSeats).toString());
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to make a payment');
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
            no_of_seats: numberOfSeats
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Booking failed');
        }

        const data = await response.json();

        // Show success message with driver contact
        toast.success(`Booking confirmed! Driver contact: ${data.driver_phone}`, {
          duration: 8000,
        });

        // Update wallet balance
        if (walletBalance !== null) {
          setWalletBalance(walletBalance - (selectedRide.price * numberOfSeats));
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
            no_of_seats: numberOfSeats
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
      setNumberOfSeats(1);
    }
  };

  const processMpesaPayment = async () => {
    if (!selectedRide || !mpesaPhone || !mpesaAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to make a payment');
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
          no_of_seats: numberOfSeats
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
        amount: parseFloat(mpesaAmount), // This is already the total amount
        booking_id: bookingData.booking_id || bookingData.id
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
      setMpesaAmount('');
      setSelectedRide(null);
      setNumberOfSeats(1);

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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'shadow-xl',
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
        }}
      />

      {/* Payment Modal */}
      {showPaymentModal && selectedRide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="bg-gradient-to-r from-[#00204a] to-[#08A6F6] p-6 text-white relative">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedRide(null);
                  setNumberOfSeats(1);
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <FaTimes size={20} />
              </button>
              <h3 className="text-2xl font-bold">Complete Booking</h3>
              <p className="text-white/80 text-sm mt-1">Select a payment method to confirm your seat</p>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-sm">Trip Total ({numberOfSeats} {numberOfSeats === 1 ? 'seat' : 'seats'})</span>
                  <span className="font-bold text-gray-800 text-lg">KSh {(selectedRide.price * numberOfSeats).toLocaleString()}</span>
                </div>

                {/* Seat Selector */}
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-blue-200/50">
                  <span className="text-gray-600 font-medium text-sm">Number of Seats (Max {selectedRide.available_seats})</span>
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                    <button
                      onClick={() => setNumberOfSeats(Math.max(1, numberOfSeats - 1))}
                      disabled={numberOfSeats <= 1}
                      className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-gray-800 w-4 text-center">{numberOfSeats}</span>
                    <button
                      onClick={() => setNumberOfSeats(Math.min(selectedRide.available_seats, numberOfSeats + 1))}
                      disabled={numberOfSeats >= selectedRide.available_seats}
                      className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium text-primary-dark">{selectedRide.departure_location}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-primary-dark">{selectedRide.destination}</span>
                </div>
              </div>

              <div className="space-y-3">
                {showMpesaForm ? (
                  <div className="space-y-4 animate-in slide-in-from-right duration-200">
                    <div>
                      <label htmlFor="mpesa-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        id="mpesa-phone"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g., 254712345678"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all bg-gray-50"
                        disabled={isProcessingPayment}
                      />
                    </div>
                    <div>
                      <label htmlFor="mpesa-amount" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Amount (KSh)
                      </label>
                      <input
                        type="number"
                        id="mpesa-amount"
                        value={mpesaAmount}
                        onChange={(e) => setMpesaAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:border-transparent transition-all bg-gray-50"
                        disabled={isProcessingPayment}
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={processMpesaPayment}
                        disabled={isProcessingPayment || !mpesaPhone || !mpesaAmount}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold shadow-lg transform transition active:scale-95 ${isProcessingPayment || !mpesaPhone || !mpesaAmount
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                          }`}
                      >
                        {isProcessingPayment ? (
                          <span className="flex items-center justify-center">
                            <FaSpinner className="animate-spin mr-2" />
                            Processing...
                          </span>
                        ) : (
                          `Pay KSh ${(selectedRide.price * numberOfSeats).toLocaleString()}`
                        )}
                      </button>
                      <button
                        onClick={() => setShowMpesaForm(false)}
                        disabled={isProcessingPayment}
                        className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePaymentSelection('wallet')}
                      disabled={isProcessingPayment || (walletBalance !== null && walletBalance < (selectedRide.price * numberOfSeats))}
                      className="w-full group relative flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#08A6F6]/30 hover:bg-[#C0DFED]/10 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          {isProcessingPayment ? (
                            <FaSpinner className="animate-spin text-primary" />
                          ) : (
                            <IoWallet className="text-primary text-xl" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-800">Wallet</div>
                          {walletBalance !== null && (
                            <div className={`text-xs mt-0.5 ${walletBalance < (selectedRide.price * numberOfSeats) ? 'text-red-500' : 'text-green-600'}`}>
                              Balance: KSh {walletBalance.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <button
                      onClick={() => handlePaymentSelection('mpesa')}
                      disabled={isProcessingPayment}
                      className="w-full group relative flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-500/30 hover:bg-green-50/30 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100/50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <IoCash className="text-green-600 text-xl" />
                        </div>
                        <span className="font-semibold text-gray-800">M-Pesa</span>
                      </div>
                      <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <button
                      onClick={() => handlePaymentSelection('card')}
                      disabled={isProcessingPayment}
                      className="w-full group relative flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#08A6F6]/30 hover:bg-[#C0DFED]/20 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <IoCard className="text-[#08A6F6] text-xl" />
                        </div>
                        <span className="font-semibold text-gray-800">Card</span>
                      </div>
                      <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#00204a] via-[#04689E] to-[#08A6F6] pb-32 pt-16 px-6 shadow-lg overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white mix-blend-overlay filter blur-3xl opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white mix-blend-overlay filter blur-2xl animate-pulse opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#C0DFED] mix-blend-overlay filter blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Find your <span className="text-[#C0DFED]">Perfect Ride</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Connect with trusted drivers, book seats instantly, and travel with comfort and peace of mind.
          </p>
        </div>
      </div>

      {/* Search Section - Floating */}
      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-20 mb-12">
        <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 border border-gray-100 backdrop-blur-sm bg-white/95">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

            <div className="md:col-span-3 relative group">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block pl-3">From</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-[#08A6F6] group-focus-within:text-[#00204a] transition-colors" />
                </div>
                <input
                  type="text"
                  name="departure"
                  value={searchParams.departure}
                  onChange={handleInputChange}
                  placeholder="Starting point"
                  className="pl-11 w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#08A6F6]/20 focus:bg-white focus:border-[#08A6F6]/30 transition-all text-gray-800 font-medium placeholder-gray-400"
                />
              </div>
            </div>

            <div className="hidden md:block md:col-span-1 flex justify-center">
              <div className="w-8 h-0.5 bg-gray-200 mx-auto rounded-full"></div>
            </div>

            <div className="md:col-span-3 relative group">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block pl-3">To</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400 group-focus-within:text-[#08A6F6] transition-colors" />
                </div>
                <input
                  type="text"
                  name="destination"
                  value={searchParams.destination}
                  onChange={handleInputChange}
                  placeholder="Destination"
                  className="pl-11 w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#08A6F6]/20 focus:bg-white focus:border-[#08A6F6]/30 transition-all text-gray-800 font-medium placeholder-gray-400"
                />
              </div>
            </div>

            <div className="md:col-span-3 relative group">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block pl-3">Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-5 w-5 text-[#08A6F6] group-focus-within:text-[#00204a] transition-colors" />
                </div>
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleInputChange}
                  className="pl-11 w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#08A6F6]/20 focus:bg-white focus:border-[#08A6F6]/30 transition-all text-gray-800 font-medium placeholder-gray-400"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-2 pt-6">
              <button
                type="submit"
                className="w-full bg-[#08A6F6] hover:bg-[#00204a] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#08A6F6]/20 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
              >
                <FaSearch />
                Search
              </button>
              {(searchParams.departure || searchParams.destination || searchParams.date) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#00204a]">Available Rides</h2>
            <p className="text-gray-500">
              {rides.length} {rides.length === 1 ? 'ride' : 'rides'} found
            </p>
          </div>

          {/* Optional: Add Sort/Filter dropdowns here later */}
        </div>

        {rides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <FaCar className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No rides available</h3>
            <p className="text-gray-500 max-w-sm">
              We couldn't find any rides matching your search. Try changing your filters or check back later.
            </p>
            <button
              onClick={clearSearch}
              className="mt-6 text-primary font-medium hover:underline"
            >
              View all rides
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rides.map((ride) => {
              const isExpanded = expandedRideId === ride.id;
              const departureDate = new Date(ride.departure_time);
              const isFull = ride.available_seats === 0;

              return (
                <div
                  key={ride.id}
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:translate-y-[-4px] ${isExpanded ? 'ring-2 ring-[#08A6F6]/10 shadow-lg' : ''}`}
                >
                  <div className="p-6 cursor-pointer relative" onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}>
                    {/* Route Line Visual - Absolute */}
                    <div className="absolute left-6 top-20 bottom-24 w-0.5 bg-gray-100 hidden sm:block"></div>

                    <div className="flex flex-col sm:flex-row gap-6">

                      {/* Left: Driver & Route */}
                      <div className="flex-1">
                        {/* Driver Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative">
                            {ride.driver.profile_picture ? (
                              <img
                                src={ride.driver.profile_picture}
                                alt={ride.driver.username}
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-blue-600 flex items-center justify-center text-white border-2 border-white shadow-md">
                                <FaUser />
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-[#08A6F6] transition-colors">
                            {ride.driver.first_name || ride.driver.username}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 gap-2">
                            <span>@{ride.driver.username}</span>
                          </div>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="space-y-4 relative">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 min-w-[12px] h-3 rounded-full bg-[#08A6F6] ring-4 ring-blue-50 relative z-10"></div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg leading-none">{ride.departure_location}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-1 min-w-[12px] h-3 rounded-full bg-[#00204a] ring-4 ring-gray-50 relative z-10"></div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg leading-none">{ride.destination}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {/* Assuming simple duration calculation or just styling */}
                              Arrival Point
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Status */}
                    <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end min-w-[120px] pt-6 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-gray-100 sm:border-gray-50 mt-6 sm:mt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold tracking-wider">Price per seat</p>
                        <p className="text-xl sm:text-2xl font-black text-[#08A6F6]">KSh {ride.price}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 sm:gap-3">
                        <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1.5 ${isFull ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                          }`}>
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          {isFull ? 'Full' : `${ride.available_seats} seats left`}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isFull) {
                              setSelectedRide(ride);
                              setShowPaymentModal(true);
                            }
                          }}
                          disabled={isFull}
                          className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all ${isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-[#08A6F6] text-white hover:bg-[#00204a] hover:translate-y-[-2px] active:scale-95 shadow-[#08A6F6]/10'
                            }`}
                        >
                          {isFull ? 'Sold Out' : 'Book Seat'}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Expand Toggle */}
                  <div className="absolute bottom-4 right-1/2 translate-x-1/2 sm:hidden text-gray-300">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Vehicle Photos Column */}
                        <div>
                          <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FaCar className="text-[#08A6F6]" /> Vehicle Photos
                          </h5>
                          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100">
                            {ride.images && ride.images.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {ride.images.map((img) => (
                                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                                    <img
                                      src={img.image}
                                      alt="Vehicle"
                                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                No vehicle photos available
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ride Information Column */}
                        <div>
                          <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[#08A6F6]" /> Ride Details
                          </h5>
                          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg text-[#08A6F6]">
                                <FaCalendarAlt size={14} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Departure Date</p>
                                <p className="text-sm font-semibold">{departureDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg text-[#08A6F6]">
                                <FaClock size={14} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Departure Time</p>
                                <p className="text-sm font-semibold">{departureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>

                            {ride.additional_info && (
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#08A6F6]">
                                  <FaInfoCircle size={14} />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Additional Info</p>
                                  <p className="text-sm text-gray-600 line-clamp-3">{ride.additional_info}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Page