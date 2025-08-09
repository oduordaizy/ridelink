'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import DriverSidebar from '../../components/DriverSidebar';
import { IoNotifications, IoMenu, IoClose } from 'react-icons/io5';
import Link from 'next/link';

const DriverLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Set client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && 
          !(event.target as HTMLElement).closest('[data-sidebar-toggle]')) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const getInitials = (user: { first_name?: string; last_name?: string } | null | undefined) => {
    if (!user?.first_name) return 'U';
    const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden">
          <div 
            ref={sidebarRef}
            className="relative flex flex-col w-72 max-w-xs h-full bg-white shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">RideLink</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <span className="sr-only">Close sidebar</span>
                <IoClose className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DriverSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          {/* <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Travas</h2>
          </div> */}
          <div className="flex-1 overflow-y-auto">
            <DriverSidebar />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                data-sidebar-toggle
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <span className="sr-only">Open sidebar</span>
                <IoMenu className="w-6 h-6" />
              </button>
              <h1 className="ml-2 text-lg font-semibold text-gray-900 md:ml-4">
                {pathname === '/dashboard/driver' ? 'Dashboard' : 
                 pathname.includes('/myrides') ? 'My Rides' :
                 pathname.includes('/wallet') ? 'Wallet' :
                 pathname.includes('/profile') ? 'Profile' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {}}
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <IoNotifications className="h-6 w-6" />
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500"></span>
                </div>
              </button>
              
              {/* Profile dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {getInitials(user)}
                  </div>
                </button>
                
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Link
                        href="/dashboard/driver/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          router.push('/');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-blue-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
