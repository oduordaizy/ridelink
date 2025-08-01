'use client'
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { IoNotifications } from "react-icons/io5";
import { FaCar } from "react-icons/fa";

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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <div className="flex items-center space-x-2 text-[#023E8A] text-xl font-bold">
          <FaCar />
          <Link href="/" className="hover:underline">Travas</Link>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
          <Link href="#" className="hover:text-[#023E8A]  transition">Find Rides</Link>
          <Link href="#" className="hover:text-[#023E8A]  transition">My Bookings</Link>
          <Link href="#" className="hover:text-[#023E8A]  transition">Help</Link>
        </div>

        <div className="flex items-center space-x-4">
          <IoNotifications className="text-2xl text-gray-600 hover:text-[#023E8A]  cursor-pointer" />
                   
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
                      logout && logout();
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

      {/* Hero Section */}
      <section className="px-6 py-16 text-center bg-[#CAF0F8]">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Find your perfect ride</h1>
        <p className="text-lg md:text-xl text-gray-600">Search, book, and travel with trusted drivers around you</p>

        {/* Search Filters Placeholder */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="From"
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
          />
          <input
            type="text"
            placeholder="To"
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
          />
          <input
            type="date"
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
          />
          <button className="bg-[#023E8A]  text-white px-6 py-3 rounded-lg hover:bg-[#0077B6]   transition">
            Search
          </button> 
        </div>
      </section>

      {/* Available Rides Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Available Rides</h2>
          <select className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0096C7]">
            <option>Sort by Price</option>
            <option>Sort by Rating</option>
            <option>Sort by Time</option>
          </select>
        </div>

        {/* Ride cards placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Example Ride Card */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold">Nairobi to Nakuru</h3>
            <p className="text-gray-600">Departure: 10:00 AM | 30th July</p>
            <p className="text-[#023E8A]  font-bold mt-2">Ksh 800</p>
            <button className="mt-4 px-4 py-2 bg-[#0077B6] text-white rounded hover:bg-[#023E8A] transition">
              Book Now
            </button>
          </div>
          {/* Add more ride cards dynamically here */}
        </div>
      </section>
    </div>
  );
};

export default Page;
