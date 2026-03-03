'use client'

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaLocationDot, FaMapLocationDot, FaCalendarDays, FaClock, FaUsers, FaMoneyBill, FaXmark, FaImage, FaUserPen, FaCircleCheck, FaTriangleExclamation } from "react-icons/fa6"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { API_BASE_URL } from '@/app/services/api';
import PaymentSuccess from '@/app/components/Success';
import { FaSpinner, FaWallet, FaMobileScreenButton } from "react-icons/fa6";
import STKPushQueryLoading from '@/app/components/StkQueryLoading';
import { stkPushQuery } from '@/app/actions/stkPushQuery';


interface RideFormData {
  departure_location: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  available_seats: number | '';
  price: number | '';
  additional_info: string;
  vehicle_images: File[];
}

const ImagePreview = ({ file }: { file: File }) => {
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!preview) return <div className="w-full h-full bg-gray-100 animate-pulse" />;

  return (
    <img
      src={preview}
      alt="Vehicle preview"
      className="w-full h-full object-cover"
    />
  );
};

export default function CreateRidePage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<RideFormData>({
    departure_location: '',
    destination: '',
    departure_time: '',
    departure_date: new Date().toISOString().split('T')[0],
    available_seats: 1,
    price: '',
    additional_info: '',
    vehicle_images: [],
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mpesa'>('wallet');
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');

  const hasCheckedProfile = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    const checkProfile = async () => {
      if (hasCheckedProfile.current) return;
      hasCheckedProfile.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIsProfileComplete(data.is_profile_complete);

          // Determine missing fields for UI guidance
          const missing = [];
          if (!data.profile_picture || data.profile_picture.includes('default-profile.png')) missing.push("Profile Picture");
          if (!data.license_number) missing.push("Driving License Number");
          if (!data.vehicle_model) missing.push("Vehicle Model");
          if (!data.vehicle_color) missing.push("Vehicle Color");
          if (!data.vehicle_plate) missing.push("Vehicle Plate Number");
          setMissingFields(missing);

          // Keep AuthContext in sync
          updateUser(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchWallet = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/payments/wallet/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.wallet.balance);
        }
      } catch (err) {
        console.error('Error fetching wallet:', err);
      }
    };

    if (user && !hasCheckedProfile.current) {
      checkProfile();
      fetchWallet();
    }
  }, [isLoading, user, router, updateUser]);

  const stkPushQueryWithIntervals = (checkoutRequestId: string) => {
    let currentAttempt = 0;
    const STILL_PROCESSING_CODES = ['500.001.1001', '500.001.1000', '1'];
    const MAX_ATTEMPTS = 25;
    const token = localStorage.getItem('access_token');

    if (!token) return;

    const timer = setInterval(async () => {
      currentAttempt += 1;
      setAttempt(currentAttempt);

      if (currentAttempt >= MAX_ATTEMPTS) {
        clearInterval(timer);
        setStkQueryLoading(false);
        setIsSubmitting(false);
        toast.error("Payment confirmation timeout. Please check your notifications shortly.");
        return;
      }

      const { data, error } = await stkPushQuery(checkoutRequestId, token);

      if (error) {
        const errorData = error.response?.data;
        const errorCode = String(errorData?.errorCode || '');

        if (errorCode && !STILL_PROCESSING_CODES.includes(errorCode)) {
          clearInterval(timer);
          setStkQueryLoading(false);
          setIsSubmitting(false);
          toast.error(errorData?.errorMessage || "Payment failed");
        }
        return;
      }

      if (data) {
        if (data.internal_status === "success") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setIsSubmitting(false);
          setShowSuccess(true);
          return;
        } else if (data.internal_status === "failed") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setIsSubmitting(false);
          toast.error(data.internal_result_desc || "Payment failed");
          return;
        }
      }
    }, 3000);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;

    if (name === 'available_seats') {
      return;
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number'
          ? (value === '' ? '' : parseFloat(value))
          : value,
      }));
    }
  }, []);

  const removeImage = useCallback((indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      vehicle_images: prev.vehicle_images.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('Files selected:', files);
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => {
        const updated = {
          ...prev,
          vehicle_images: [...prev.vehicle_images, ...newFiles]
        };
        console.log('Updated formData images:', updated.vehicle_images);
        return updated;
      });
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  }, []);

  const handleAvailableSeatsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or any positive number
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setFormData(prev => ({
        ...prev,
        available_seats: value === '' ? '' : Number(value),
      }));
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.vehicle_images.length === 0) {
      toast.error('Please upload at least one vehicle photo');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate platform fee for local validation
      const price = Number(formData.price) || 0;
      const seats = Number(formData.available_seats) || 1;
      const platformFee = Math.max(1, price * seats * 0.01);

      // Final balance check for wallet payment
      if (paymentMethod === 'wallet' && walletBalance !== null && walletBalance < platformFee) {
        toast.error(`Insufficient balance. You need KES ${platformFee.toFixed(2)} but have KES ${walletBalance.toFixed(2)}.`);
        setIsSubmitting(false);
        return;
      }

      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;

      const formDataToSend = new FormData();
      // Only append fields that the backend expects
      formDataToSend.append('departure_location', formData.departure_location);
      formDataToSend.append('destination', formData.destination);
      formDataToSend.append('departure_time', departureDateTime);
      formDataToSend.append('available_seats', String(formData.available_seats || 1));
      formDataToSend.append('price', String(formData.price || 0));
      formDataToSend.append('additional_info', formData.additional_info);

      formData.vehicle_images.forEach((file) => {
        formDataToSend.append('uploaded_images', file); // Backend expects 'uploaded_images'
      });

      // Add payment method for the platform fee
      formDataToSend.append('payment_method', paymentMethod);

      const response = await fetch(`${API_BASE_URL}/rides/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();

        if (paymentMethod === 'mpesa' && result.checkout_request_id) {
          setCheckoutRequestId(result.checkout_request_id);
          setStkQueryLoading(true);
          stkPushQueryWithIntervals(result.checkout_request_id);
          toast.info("Please complete the M-Pesa payment on your phone to activate the ride.");
        } else {
          toast.success('Ride created successfully!');
          setShowSuccess(true);
          setFormData({
            departure_location: '',
            destination: '',
            departure_date: new Date().toISOString().split('T')[0],
            departure_time: '',
            available_seats: 1,
            price: '',
            additional_info: '',
            vehicle_images: []
          });
          setIsSubmitting(false);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to create ride');
      }
    } catch (error: any) {
      console.error('Error creating ride:', error);
      toast.error(error.message || 'Error occurred while creating ride.');
      setIsSubmitting(false);
    }
  }, [user, formData, paymentMethod, walletBalance, stkPushQueryWithIntervals]);

  if (isLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#08A6F6] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Blocking UI if profile is incomplete
  if (isProfileComplete === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-amber-50 p-8 text-center border-b border-amber-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <FaTriangleExclamation className="text-amber-600 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Complete Your Profile</h2>
            <p className="text-amber-700">To maintain safety and trust on Travas, drivers must complete their profile before posting rides.</p>
          </div>

          <div className="p-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Required Information</h3>
            <ul className="space-y-3 mb-8">
              {missingFields.map((field, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  {field}
                </li>
              ))}
            </ul>

            <Link href="/dashboard/driver/profile" className="block w-full">
              <button className="w-full py-4 bg-[#08A6F6] hover:bg-[#00204a] text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group">
                <FaUserPen />
                Complete Profile Now
              </button>
            </Link>

            <button
              onClick={() => router.push('/dashboard/driver')}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <PaymentSuccess
          title="Ride Created! 🚗"
          message="Your ride has been successfully scheduled and is now visible to passengers."
          viewLink="/dashboard/driver/myrides"
          viewLabel="View My Rides"
          continueLabel="Create Another Ride"
          onContinue={() => setShowSuccess(false)}
        />
      </div>
    );
  }

  if (stkQueryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <STKPushQueryLoading number={phoneNumber || user?.phone_number || ''} attempt={attempt} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard/driver')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#08A6F6] mb-4 transition-colors"
          >
            {/* <FaArrowLeft /> */}
            {/* <span className="text-sm font-medium">Back</span> */}
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00204a] mb-2">Create a Ride</h1>
          <p className="text-gray-600 text-sm sm:text-base">Share your journey and save on costs</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From & To */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaLocationDot className="text-[#08A6F6]" />
                  From
                </label>
                <input
                  type="text"
                  name="departure_location"
                  value={formData.departure_location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  placeholder="Start location"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaMapLocationDot className="text-[#08A6F6]" />
                  To
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  placeholder="Enter destination"
                  required
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarDays className="text-[#08A6F6]" />
                  Date
                </label>
                <input
                  type="date"
                  name="departure_date"
                  value={formData.departure_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="text-[#08A6F6]" />
                  Time
                </label>
                <input
                  type="time"
                  name="departure_time"
                  value={formData.departure_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Seats & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaUsers className="text-[#08A6F6]" />
                  Seats
                </label>
                <input
                  type="number"
                  name="available_seats"
                  min="1"
                  value={formData.available_seats}
                  onChange={handleAvailableSeatsChange}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setFormData(prev => ({ ...prev, available_seats: 1 }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaMoneyBill className="text-[#08A6F6]" />
                  Price (KSh)
                </label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="any"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  placeholder="Enter price"
                  required
                />
              </div>
            </div>

            {/* Platform Fee & Payment Method */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Platform Fee (1%)</h3>
                  <p className="text-xs text-blue-700">Required to activate and list your ride</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600">
                    KSh {Math.max(1, (Number(formData.price) || 0) * (Number(formData.available_seats) || 1) * 0.01).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'wallet'
                      ? 'border-[#08A6F6] bg-white text-[#08A6F6] shadow-sm'
                      : 'border-transparent bg-gray-100/50 text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <FaWallet className="text-lg" />
                  <span className="text-xs font-bold">Wallet</span>
                  {walletBalance !== null && (
                    <span className="text-[10px] opacity-70">Bal: KSh {walletBalance.toFixed(0)}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('mpesa');
                    if (!phoneNumber && user?.phone_number) setPhoneNumber(user.phone_number);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'mpesa'
                      ? 'border-[#08A6F6] bg-white text-[#08A6F6] shadow-sm'
                      : 'border-transparent bg-gray-100/50 text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <FaMobileScreenButton className="text-lg" />
                  <span className="text-xs font-bold">M-Pesa</span>
                  <span className="text-[10px] opacity-70">Direct Pay</span>
                </button>
              </div>

              {paymentMethod === 'wallet' && walletBalance !== null && walletBalance < (Number(formData.price) || 0) * (Number(formData.available_seats) || 1) * 0.01 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-[11px] font-medium animate-pulse">
                  <FaTriangleExclamation />
                  Insufficient balance. Switching to M-Pesa is recommended.
                </div>
              )}

              {paymentMethod === 'mpesa' && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirm M-Pesa Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08A6F6] text-sm text-black"
                  />
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Info (Optional)
              </label>
              <textarea
                name="additional_info"
                rows={3}
                value={formData.additional_info}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all resize-none"
                placeholder="Any special requirements or details..."
              />
            </div>

            {/* Vehicle Images */}
            <div>
              <div className="space-y-4">
                <label
                  htmlFor="vehicle_images"
                  className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#08A6F6] focus:outline-none"
                >
                  <div className="flex flex-col items-center space-y-2 pointer-events-none">
                    <FaImage className="w-8 h-8 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Click to upload photos
                    </span>
                  </div>
                </label>
                {/* Hidden File Input outside the clickable area or within but not as the target */}
                <input
                  type="file"
                  id="vehicle_images"
                  name="vehicle_images"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  tabIndex={-1}
                />

                {formData.vehicle_images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.vehicle_images.map((file, index) => (
                      <div key={index} className="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <ImagePreview file={file} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                          aria-label="Remove image"
                        >
                          <FaXmark className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.vehicle_images.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    No images selected yet
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#08A6F6] hover:bg-[#00204a] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Ride...
                </span>
              ) : (
                'Create Ride'
              )}
            </button>
          </form>
        </div>

        {/* View Scheduled Rides Link */}
        <Link href='/dashboard/driver/myrides'>
          <div className="text-center py-4 text-sm text-gray-600 hover:text-[#08A6F6] transition-colors">
            View your scheduled rides →
          </div>
        </Link>
      </div>
    </div>
  );
}