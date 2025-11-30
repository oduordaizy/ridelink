'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { IoWallet, IoCard } from "react-icons/io5";
import { FaCar, FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaSpinner } from "react-icons/fa";
import { FaMoneyBillWave as IoCash } from "react-icons/fa";
import { paymentAPI } from '@/app/services/api';
import PassengerNavbar from '@/app/components/PassengerNavbar';

interface Ride {
  id: number;
  departure_location: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price: number;
  driver: {
    username: string;
    phone_number?: string;
  };
  is_paid?: boolean;
  driver_phone?: string;
}

type PaymentMethod = 'wallet' | 'mpesa' | 'card';

const Page = () => {
  const {user, isLoading, logout} = useAuth()
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

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, fetch all rides
      const response = await fetch('http://127.0.0.1:8000/api/rides/', {
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
      
      setRides(data);
    } catch (error) {
      console.error('Error fetching rides:', error);
      alert('Failed to load rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if(!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchRides();
      fetchWalletBalance();
    }
  }, [user, isLoading, router, fetchRides]);

  

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
    fetchRides();
  };

  const clearSearch = () => {
    setSearchParams({
      departure: '',
      destination: '',
      date: ''
    });
    // Fetch all rides when clearing search
    fetchRides();
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
        // For wallet payments, just book the ride
        await bookRide(selectedRide.id, 'wallet', token);
      } else if (method === 'card') {
        // For card payments, you would integrate with your payment processor
        // This is a placeholder for the actual implementation
        await bookRide(selectedRide.id, 'card', token);
      }
      
      // Update wallet balance
      if (method === 'wallet' && walletBalance !== null) {
        setWalletBalance(walletBalance - selectedRide.price);
      }
      
      // Show success message
      alert(`Payment successful! Driver contact information is now available.`);
      
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setSelectedRide(null);
    }
  };

  const processMpesaPayment = async () => {
    if (!selectedRide || !mpesaPhone || !mpesaAmount) {
      alert('Please fill in all required fields');
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
      // First initiate M-Pesa payment using the paymentAPI service
      const paymentData = await paymentAPI.initiateMpesaPayment(token, {
        phone_number: formattedPhone,
        amount: parseFloat(mpesaAmount)
      });
      
      console.log('M-Pesa payment initiated:', paymentData);
      
      // Then book the ride
      await bookRide(selectedRide.id, 'mpesa', token);
      
      // Show success message
      alert('Payment initiated! Please check your phone to complete the M-Pesa payment.');
      setShowMpesaForm(false);
      setShowPaymentModal(false);
      setMpesaPhone('');
      setMpesaAmount('');
      setSelectedRide(null);
      
      // Refresh available rides
      fetchRides();
      
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
      
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const bookRide = async (rideId: number, paymentMethod: string, token: string) => {
    try {
      // Book the ride
      const response = await fetch(`http://127.0.0.1:8000/api/rides/${rideId}/book/`, {
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
      <PassengerNavbar 
        user={{
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email
        }} 
        onLogout={logout} 
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
                      className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                        isProcessingPayment || !mpesaPhone || !mpesaAmount
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
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isProcessingPayment || (walletBalance !== null && walletBalance < (selectedRide?.price || 0))
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
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isProcessingPayment ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'
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
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isProcessingPayment ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'
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
      <section className="px-6 py-16 text-center bg-blue-50">
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
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Available Rides</h2>
        </div>

        {/* Rides List */}
        <div className="grid grid-cols-1 gap-6">
          {rides.length === 0 ? (
            <div className="text-center py-12">
              <FaCar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No rides found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or check back later.</p>
            </div>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  {/* Ride details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaCar className="text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {ride.driver.username}&apos;s Ride
                      </h3>
                    </div>

                    <div className="space-y-2 pl-12">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                        <p className="text-gray-700">{ride.departure_location}</p>
                      </div>
                      <div className="border-l-2 border-gray-300 h-6 ml-2"></div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                        <p className="text-gray-700">{ride.destination}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(ride.departure_time).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <FaCar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {ride.available_seats > 0 ? (
                              `${ride.available_seats} seat${ride.available_seats !== 1 ? 's' : ''} left`
                            ) : (
                              <span className="text-red-500">Fully booked</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price and action */}
                  <div className="mt-4 md:mt-0 md:ml-6 text-right">
                    <div className="text-2xl font-bold text-blue-600">KSh {Number(ride.price).toFixed(2)}</div>
                    <div className="text-sm text-gray-500 mb-4">per seat</div>
                    
                    {ride.is_paid ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600">✅ Booking confirmed</p>
                        {ride.driver_phone && (
                          <p className="text-sm text-gray-700 mt-1">
                            Driver: {ride.driver_phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedRide(ride);
                          setShowPaymentModal(true);
                        }}
                        disabled={ride.available_seats <= 0}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          ride.available_seats > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {ride.available_seats > 0 ? 'Book Now' : 'Fully Booked'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;