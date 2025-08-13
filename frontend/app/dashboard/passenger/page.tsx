'use client'
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { IoNotifications } from "react-icons/io5";
import { FaCar, FaSearch, FaMapMarkerAlt, FaCalendarAlt,  FaLock } from "react-icons/fa";
import Image from 'next/image';

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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
         <Link href='/' className='pacifico-regular flex items-center text-[#0086CA]'>
            <Image src="/logo.png" alt="Logo" width={50} height={50} className="!m-0" />
            <span className="ml-0 font-semibold text-2xl">Travas</span>
          </Link>

        <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
          <Link href="#" className="hover:text-primary transition">Find Rides</Link>
          <Link href="/dashboard/passenger/bookings" className="hover:text-primary transition">My Bookings</Link>
          <Link href="/dashboard/passenger/profile" className="hover:text-primary transition">Profile</Link>
        </div>

        <div className="flex items-center space-x-4">
          <IoNotifications className="text-2xl text-gray-600 hover:text-primary cursor-pointer" />
          
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg focus:outline-none"
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
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center justify-center"
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
              <div key={ride.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {/* <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                          <FaCar className="text-primary text-sm" />
                        </div>
                        <h3 className="text-base font-medium text-foreground truncate">
                          {ride.driver.username}'s Ride
                        </h3>
                      </div> */}
                      
                      <div className="space-y-1.5">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></div>
                          </div>
                          <p className="ml-2 text-sm text-muted-foreground truncate">
                            {ride.departure_location}
                          </p>
                        </div>
                        
                        <div className="border-l-2 border-border h-4 ml-2.5"></div>
                        
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1"></div>
                          </div>
                          <p className="ml-2 text-sm text-muted-foreground truncate">
                            {ride.destination}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <svg className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(ride.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="flex items-center">
                            <svg className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-3">
                      <div className="text-xl font-bold text-primary">KSh {ride.price}</div>
                      <div className="text-xs text-muted-foreground">per seat</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-3 mt-3">
                    {ride.is_paid ? (
                      <p className="text-sm font-semibold text-primary">
                        📞 {ride.driver_phone}
                      </p>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground flex items-center">
                          <FaLock className="mr-1 text-muted-foreground" /> Contact locked
                        </p>
                        <button
                          onClick={() => alert('Please pay to unlock driver contact')}
                          className="px-3 py-1 text-xs text-primary-foreground rounded bg-primary hover:bg-primary/90 transition-colors"
                        >
                          Unlock Contact
                        </button>
                      </div>
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
