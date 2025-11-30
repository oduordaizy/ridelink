'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IoNotifications } from 'react-icons/io5';

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface PassengerNavbarProps {
  user?: User;
  onLogout?: () => void;
}

function getInitials(firstName: string = '', lastName: string = ''): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
}

export default function PassengerNavbar({ user, onLogout }: PassengerNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <Link href='/' className='pacifico-regular flex items-center text-[#0086CA]'>
        <Image 
          src="/logo.png" 
          alt="Logo" 
          width={50} 
          height={50} 
          className="!m-0" 
        />
        <span className="ml-0 font-semibold text-2xl">Travas</span>
      </Link>

      <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
        <Link href="/dashboard/passenger" className="hover:text-primary transition">Find Rides</Link>
        <Link href="/dashboard/passenger/bookings" className="hover:text-primary transition">My Bookings</Link>
        <Link href="/dashboard/passenger/wallet" className="hover:text-primary transition">Wallet</Link>
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
            {getInitials(user?.first_name, user?.last_name)}
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
                  onLogout?.();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
