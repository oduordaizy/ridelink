'use client'

import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { FaCar } from "react-icons/fa"
import { IoNotifications } from "react-icons/io5"
import { FaCirclePlus } from "react-icons/fa6"
import { toast } from 'react-toastify';
import DriverNavbar from '@/app/components/DriverNavbar';


interface RideFormData {
    departure_location: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    available_seats: number;
    price: number;
    additional_info: string;
}

const Page = () => {
  const {user, isLoading, logout} = useAuth()
  const router = useRouter() 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RideFormData>({
    departure_location: '',
    destination: '',
    departure_time: '',
    departure_date: new Date().toISOString().split('T')[0], // initialize with string: new Date(),
    available_seats: 0,
    price: 0,
    additional_info: '',
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); 
  
  useEffect(()=>{
    if(!isLoading && !user){
      router.push('/auth/login')
    }
  }, [user, isLoading, router]);    

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

  // Avatar initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;

      const payload = {
        departure_location: formData.departure_location,
        destination: formData.destination,
        departure_time: departureDateTime,
        available_seats: formData.available_seats,
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
        const text = await response.text();
        console.error("Error response (not JSON):", text);
      } else {
        const data = await response.json();
        console.log("Ride created:", data);
        toast.success('Ride created successfully!');
      }
      
      // Reset form
      setFormData({
        departure_location: '',
        destination: '',
        departure_date: new Date().toISOString().split('T')[0], // initialize with string
        departure_time: '',
        available_seats: 0,
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

  return (
    <div className="min-h-screen bg-blue-50">
      <DriverNavbar/>

      {/* Create New Ride Form */}
      <div className="p-6">
        <div className="bg-white p-6 shadow rounded-lg max-w-4xl mx-auto">
          <div className="flex items-center mb-4 space-x-2 text-blue-700">
            <FaCirclePlus className="text-2xl" />
            <h1 className="text-xl font-semibold">Create New Ride</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Location</label>
              <input type="text"  value={formData.departure_location} onChange={handleChange} name="departure_location" placeholder="Enter Departure Location" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Destination</label>
              <input type="text" value={formData.destination} onChange={handleChange} name="destination" placeholder="Enter Destination" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Date</label>
              <input type="date" value={formData.departure_date}  name="departure_date"  min={new Date().toISOString().split('T')[0]} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Time</label>
              <input type="time" value={formData.departure_time} onChange={handleChange} name="departure_time" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Seats</label>
              <input type="number" value={formData.available_seats} onChange={handleChange} name="available_seats" placeholder="e.g., 3" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price per Seat</label>
              <input type="number" value={formData.price} onChange={handleChange} name="price"  placeholder="e.g., 500" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
              <textarea  value={formData.additional_info} onChange={handleChange} name="additional_info" placeholder="Any additional details..." rows={3} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
              {isSubmitting ? 'Creating...' : 'Create Ride Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Page
