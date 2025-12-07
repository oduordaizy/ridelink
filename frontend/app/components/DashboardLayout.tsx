'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IoNotifications, IoMenu, IoClose } from 'react-icons/io5';
import { usePathname } from 'next/navigation';

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: User;
  onLogout?: () => void;
}

function getInitials(firstName: string = '', lastName: string = ''): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
}

export default function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/dashboard/passenger', label: 'Find Rides' },
    { href: '/dashboard/passenger/bookings', label: 'My Bookings' },
    { href: '/dashboard/passenger/wallet', label: 'Wallet' },
    { href: '/dashboard/passenger/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#08A6F6] to-[#00204a]">
            <Link href='/' className='pacifico-regular flex items-center'>
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="!m-0" 
              />
              <span className="ml-1 font-semibold text-xl text-white">
                Travas
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#08A6F6]/5 to-[#00204a]/5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold text-base shadow-md">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#00204a]">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive(link.href)
                    ? 'bg-[#08A6F6] text-white shadow-md'
                    : 'text-[#00204a] hover:text-[#08A6F6] hover:bg-[#08A6F6]/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              onClick={() => {
                setSidebarOpen(false);
                onLogout?.();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#00204a] hover:text-[#08A6F6] p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <IoMenu className="text-2xl" />
          </button>

          <Link href='/' className='pacifico-regular flex items-center group'>
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={50} 
              height={50} 
              className="!m-0 transition-transform group-hover:scale-105" 
            />
            <span className="ml-0 font-semibold text-2xl bg-gradient-to-r from-[#08A6F6] to-[#00204a] bg-clip-text text-transparent">
              Travas
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive(link.href)
                  ? 'bg-[#08A6F6] text-white shadow-sm'
                  : 'text-[#00204a] hover:text-[#08A6F6] hover:bg-[#08A6F6]/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          <button 
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            aria-label="Notifications"
          >
            <IoNotifications className="text-2xl text-[#00204a] group-hover:text-[#08A6F6] transition-colors" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:ring-offset-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
            >
              {getInitials(user?.first_name, user?.last_name)}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#08A6F6]/5 to-[#00204a]/5">
                  <p className="text-sm font-semibold text-[#00204a]">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/passenger/profile"
                  className="block px-4 py-2.5 text-sm text-[#00204a] hover:bg-[#08A6F6]/5 hover:text-[#08A6F6] transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  View Profile
                </Link>
                <button
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
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

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}