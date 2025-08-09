'use client'
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { IoNotifications } from "react-icons/io5";
import { FaCar, FaSearch, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

interface Ride {
  id: number;
  departure_location: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price: number;
  driver: {
    username: string;
  };
}

const Page = () => {
  const {user, isLoading, logout} = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    departure: '',
    destination: '',
    date: ''
  });

  useEffect(() => {
    if(!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchRides();
    }
  }, [user, isLoading, router]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchParams.departure) query.append('departure_location__icontains', searchParams.departure);
      if (searchParams.destination) query.append('destination__icontains', searchParams.destination);
      if (searchParams.date) query.append('departure_time__date', searchParams.date);

      const response = await fetch(`http://127.0.0.1:8000/api/rides/?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRides(data);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Avatar initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <div className="flex items-center space-x-2 text-[#023E8A] text-xl font-bold">
          <FaCar />
          <Link href="/" className="hover:underline">Travas</Link>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
          <Link href="#" className="hover:text-[#023E8A] transition">Find Rides</Link>
          <Link href="/dashboard/passenger/bookings" className="hover:text-[#023E8A] transition">My Bookings</Link>
          <Link href="/dashboard/passenger/profile" className="hover:text-[#023E8A] transition">Profile</Link>
        </div>

        <div className="flex items-center space-x-4">
          <IoNotifications className="text-2xl text-gray-600 hover:text-[#023E8A] cursor-pointer" />
          
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg focus:outline-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
            >
              {getInitials(user?.first_name || '', user?.last_name || '')}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                <Link
                  href="/dashboard/passenger/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
                </Link>
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
      </nav>

      {/* Hero Section with Search */}
      <section className="px-6 py-16 text-center bg-blue-50">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Find your perfect ride</h1>
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
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
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
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
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
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0096C7]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#023E8A] text-white px-6 py-3 rounded-lg hover:bg-[#0077B6] transition flex items-center justify-center"
            >
              <FaSearch className="mr-2" />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Available Rides Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Available Rides</h2>
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
              <div key={ride.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ride.departure_location} to {ride.destination}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(ride.departure_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Driver: {ride.driver.username} • {ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#023E8A]">KSh {ride.price}</span>
                    </div>
                    <Link
                      href={`/dashboard/passenger/rides/${ride.id}/book`}
                      className="bg-[#023E8A] text-white px-6 py-2 rounded-lg hover:bg-[#0077B6] transition text-center"
                    >
                      Book Now
                    </Link>
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
