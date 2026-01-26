'use client'

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaLocationDot, FaMapLocationDot, FaCalendarDays, FaClock, FaUsers, FaMoneyBill, FaXmark, FaImage } from "react-icons/fa6"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { API_BASE_URL } from '@/app/services/api';


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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

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
      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;

      const formDataToSend = new FormData();
      formDataToSend.append('departure_location', formData.departure_location);
      formDataToSend.append('destination', formData.destination);
      formDataToSend.append('departure_time', departureDateTime);
      formDataToSend.append('available_seats', (formData.available_seats || 1).toString());
      formDataToSend.append('price', (formData.price || 0).toString());
      if (formData.additional_info) {
        formDataToSend.append('additional_info', formData.additional_info);
      }

      formData.vehicle_images.forEach((file) => {
        formDataToSend.append('uploaded_images', file);
      });

      const response = await fetch(`${API_BASE_URL}/rides/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataToSend,
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
        price: '',
        additional_info: '',
        vehicle_images: []
      });

      router.push('/dashboard/driver');
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create ride');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, router]);

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
                  Price (KSH)
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