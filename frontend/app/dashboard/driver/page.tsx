'use client'

import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { FaCar } from "react-icons/fa"
import { IoNotifications } from "react-icons/io5"
import { FaCirclePlus } from "react-icons/fa6"

const Page = () => {
  const {user, isLoading, logout} = useAuth()
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <div className="flex items-center space-x-2 text-blue-700 text-xl font-bold">
          <FaCar />
          <Link href="/" className="hover:underline">Travas</Link>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
          <Link href="#" className="hover:text-blue-700 transition">Dashboard</Link>
          <Link href="#" className="hover:text-blue-700 transition">My Rides</Link>
          <Link href="#" className="hover:text-blue-700 transition">Wallet</Link>
          <Link href="#" className="hover:text-blue-700 transition">Profile</Link>
        </div>

        <div className="flex items-center space-x-4">
          <IoNotifications className="text-2xl text-gray-600 hover:text-blue-700 cursor-pointer" />

          {/* <div className="w-8 h-8 rounded-full bg-gray-300" /> */}

          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">{user.first_name} {user.last_name}</span>
            <div className="relative" ref={dropdownRef}>
              <button
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg focus:outline-none"
                onClick={() => setDropdownOpen(v => !v)}
                aria-label="User menu"
              >
                {getInitials(user.first_name + ' ' + user.last_name)}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setDropdownOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                        setDropdownOpen(false);
                        setTimeout(() => logout(), 0);
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Create New Ride Form */}
      <div className="p-6">
        <div className="bg-white p-6 shadow rounded-lg max-w-4xl mx-auto">
          <div className="flex items-center mb-4 space-x-2 text-blue-700">
            <FaCirclePlus className="text-2xl" />
            <h1 className="text-xl font-semibold">Create New Ride</h1>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Location</label>
              <input type="text" placeholder="Enter Departure Location" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Destination</label>
              <input type="text" placeholder="Enter Destination" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Date</label>
              <input type="date" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Time</label>
              <input type="time" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Seats</label>
              <input type="number" placeholder="e.g., 3" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price per Seat</label>
              <input type="number" placeholder="e.g., 500" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
              <textarea placeholder="Any additional details..." rows={3} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                Create Ride Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Page
