'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  User,
  Settings,
  Menu,
  X,
  Car,
  Wallet,
  History,
  BellOff,
  LogOut,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const DriverLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard/driver' },
    { id: 'rides', icon: Car, label: 'My Rides', href: '/dashboard/driver/myrides' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', href: '/dashboard/driver/wallet' },
    { id: 'profile', icon: User, label: 'Profile', href: '/dashboard/driver/profile' },
  ];

  // Set client-side rendering and role check
  useEffect(() => {
    setIsClient(true);
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.user_type !== 'driver') {
      router.push('/dashboard/passenger');
    }
  }, [user, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideDesktop = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleItemClick = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  const userName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.first_name || user?.username || 'User';
  const userEmail = user?.email || '';

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#08A6F6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link href="/" className="flex items-center gap-0">
            <Image src="/logo.png" alt="iTravas Logo" width={32} height={32} />
            <span className="text-xl font-semibold text-[#08A6F6]">iTravas</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver/notifications"
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative"
          >
            <BellOff className="h-5 w-5" />
          </Link>

          {/* Profile dropdown */}
          <div ref={mobileDropdownRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08A6F6]"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold">
                {getInitials(user)}
              </div>
            </button>

            {isProfileOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/dashboard/driver/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      try {
                        await switchRole();
                        router.push('/dashboard/passenger');
                      } catch (error) {
                        console.error('Failed to switch to passenger mode:', error);
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-[#08A6F6] font-medium hover:bg-gray-100 border-t border-gray-100"
                  >
                    Switch to Passenger Mode
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-0">
            <Image src="/logo.png" alt="iTravas Logo" width={32} height={32} />
            <span className="text-xl font-semibold text-[#08A6F6]">iTravas</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl
                      transition-all duration-200 group
                      ${isActive
                        ? 'bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white shadow-lg shadow-[#08A6F6]/30'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout Section */}
        <div className="border-t border-gray-200">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold">
                {getInitials(user)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">{userName}</h3>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#08A6F6] hover:bg-blue-50 transition-colors font-medium border-t border-gray-100"
            onClick={async () => {
              try {
                await switchRole();
                router.push('/dashboard/passenger');
              } catch (error) {
                console.error('Failed to switch to passenger mode:', error);
              }
            }}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Switch to Passenger</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {pathname === '/dashboard/driver' ? 'Dashboard' :
                  pathname.includes('/myrides') ? 'My Rides' :
                    pathname.includes('/wallet') ? 'Wallet' :
                      pathname.includes('/profile') ? 'Profile' : 'Dashboard'}
              </h1>

              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/driver/notifications"
                  className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <BellOff className="h-6 w-6" />
                </Link>

                {/* Profile dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08A6F6]"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold">
                      {getInitials(user)}
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Link
                          href="/dashboard/driver/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-xl"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={async () => {
                            setIsProfileOpen(false);
                            try {
                              await switchRole();
                              router.push('/dashboard/passenger');
                            } catch (error) {
                              console.error('Failed to switch to passenger mode:', error);
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-[#08A6F6] font-medium hover:bg-gray-100 border-t border-gray-100"
                        >
                          Switch to Passenger Mode
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
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
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverLayout;