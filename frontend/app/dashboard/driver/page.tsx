'use client'

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaCirclePlus } from "react-icons/fa6"
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    // Allow empty string or numbers between 1 and 10
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
        available_seats: Number(formData.available_seats) || 1, // Ensure it's a number
        price: formData.price,
        additional_info: formData.additional_info || undefined,
      };

      const response = await fetch('http://127.0.0.1:8000/api/rides/', {
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
      
      // Reset form
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;

  }

  if (user){
    const accessToken = localStorage.getItem('access_token');  // If you stored it
    console.log(accessToken);
  }

  return (
    
    <div className="min-h-screen bg-blue-50">
      
      <div className="max-w-4xl mx-auto">
        <div className='flex justify-between'>
        <div className="flex items-center mb-4">
          <FaCirclePlus className="text-blue-600 text-xl mr-2" />
          <h1 className="text-xl font-bold text-blue-600">Create New Ride</h1>
        </div>
          <div><Link href='/dashboard/driver/myrides'><Button>View Scheduled Rides</Button></Link></div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="departure_location" className="block text-sm font-medium text-gray-700">
                  Departure Location *
                </label>
                <input
                  type="text"
                  id="departure_location"
                  name="departure_location"
                  value={formData.departure_location}
                  onChange={handleChange}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                  Destination *
                </label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="departure_date"
                  name="departure_date"
                  value={formData.departure_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700">
                  Time *
                </label>
                <input
                  type="time"
                  id="departure_time"
                  name="departure_time"
                  value={formData.departure_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="available_seats" className="block text-sm font-medium text-gray-700">
                  Available Seats *
                </label>
                <input
                  type="number"
                  id="available_seats"
                  name="available_seats"
                  min="1"
                  max="10"
                  value={formData.available_seats || ''}
                  onChange={handleAvailableSeatsChange}
                  onBlur={(e) => {
                    // Ensure at least 1 seat is selected when input loses focus
                    const value = Number(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setFormData(prev => ({
                        ...prev,
                        available_seats: 1
                      }));
                    } else if (value > 10) {
                      setFormData(prev => ({
                        ...prev,
                        available_seats: 10
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price per Seat (KSH) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">
                Additional Information
              </label>
              <textarea
                id="additional_info"
                name="additional_info"
                rows={3}
                value={formData.additional_info}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional details about the ride..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/driver')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Ride'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
