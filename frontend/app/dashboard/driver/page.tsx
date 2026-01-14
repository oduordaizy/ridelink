'use client'

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaLocationDot, FaMapLocationDot, FaCalendarDays, FaClock, FaUsers, FaMoneyBill } from "react-icons/fa6"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { API_BASE_URL } from '@/app/services/api';


interface RideFormData {
    departure_location: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    available_seats: number;
    price: number;
    additional_info: string;
}

export default function CreateRidePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RideFormData>({
    departure_location: '',
    destination: '',
    departure_time: '',
    departure_date: new Date().toISOString().split('T')[0],
    available_seats: 1,
    price: 0,
    additional_info: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === 'available_seats') {
      return;
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (parseFloat(value) || 0) : value,
      }));
    }
  };

  const handleAvailableSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (Number(value) >= 1 && Number(value) <= 10)) {
      setFormData(prev => ({
        ...prev,
        available_seats: value === '' ? 0 : Number(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;
      const payload = {
        departure_location: formData.departure_location,
        destination: formData.destination,
        departure_time: departureDateTime,
        available_seats: Number(formData.available_seats) || 1,
        price: formData.price,
        additional_info: formData.additional_info || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/rides/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create ride');
      }

      await response.json();
      toast.success('Ride created successfully!');
      
      setFormData({
        departure_location: '',
        destination: '',
        departure_date: new Date().toISOString().split('T')[0],
        departure_time: '',
        available_seats: 1,
        price: 0,
        additional_info: ''
      });
      
      router.push('/dashboard/driver');
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#08A6F6] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          <div className="space-y-6">
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
                  max="10"
                  value={formData.available_seats || ''}
                  onChange={handleAvailableSeatsChange}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setFormData(prev => ({ ...prev, available_seats: 1 }));
                    } else if (value > 10) {
                      setFormData(prev => ({ ...prev, available_seats: 10 }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaMoneyBill className="text-[#08A6F6]" />
                  Price (KSH)
                </label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:bg-white transition-all"
                  placeholder="0"
                  required
                />
              </div>
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

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
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
          </div>
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