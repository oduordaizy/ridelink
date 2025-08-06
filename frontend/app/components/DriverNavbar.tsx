'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaCar } from 'react-icons/fa';
import { IoNotifications } from 'react-icons/io5';
import React, { useEffect, useRef, useState } from 'react';

const DriverNavbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!user) return null;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2 text-blue-700 text-xl font-bold">
        <FaCar />
        <Link href="/" className="hover:underline">Travas</Link>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center space-x-6 text-gray-700 text-sm font-medium">
        <Link href="/dashboard/driver" className="hover:text-blue-700 transition">Dashboard</Link>
        <Link href="/dashboard/driver/myrides" className="hover:text-blue-700 transition">My Rides</Link>
        <Link href="/dashboard/driver/wallet" className="hover:text-blue-700 transition">Wallet</Link>
        <Link href="/dashboard/driver/profile" className="hover:text-blue-700 transition">Profile</Link>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        <IoNotifications className="text-2xl text-gray-600 hover:text-blue-700 cursor-pointer" />

        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </span>
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg focus:outline-none"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User menu"
            >
              {getInitials(`${user.first_name} ${user.last_name}`)}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard/driver/profile');
                  }}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
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
  );
};

export default DriverNavbar;
