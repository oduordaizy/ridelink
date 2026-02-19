'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IoNotificationsOff, IoMenu, IoClose } from 'react-icons/io5';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id?: number;
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
  const router = useRouter();
  const { switchRole } = useAuth();

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

  const hasUser = !!(user && (user as any).id);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#08A6F6] to-[#00204a]">
            <Link href='/' className='pacifico-regular flex items-center'>
              <Image
                src="/logo.png"
                alt="Logo"
                width={30}
                height={30}
                className="!m-0"
              />
              <span className="ml-1 font-semibold text-xl text-white">
                iTravas
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
          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#C0DFED]/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold text-base shadow-md">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#00204a]">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-[#828282] truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${isActive(link.href)
                  ? 'bg-[#08A6F6] text-white shadow-md'
                  : 'text-[#484848] hover:text-[#08A6F6] hover:bg-[#C0DFED]/30'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="px-4 py-4 border-t border-[#E5E7EB] space-y-1">
            <button
              className="w-full px-4 py-3 text-left text-[#08A6F6] hover:bg-blue-50 rounded-lg transition-colors font-medium"
              onClick={async () => {
                setSidebarOpen(false);
                try {
                  await switchRole();
                  router.push('/dashboard/driver');
                } catch (error) {
                  console.error('Failed to switch to driver mode:', error);
                }
              }}
            >
              Switch to Driver Mode
            </button>
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
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-[#E5E7EB]">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#484848] hover:text-[#08A6F6] p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <IoMenu className="text-2xl" />
          </button>

          <Link href='/' className='pacifico-regular flex items-center group'>
            <Image
              src="/logo.png"
              alt="Logo"
              width={30}
              height={30}
              className="!m-0 transition-transform group-hover:scale-105"
            />
            <span className="ml-0 font-semibold text-2xl text-[#08A6F6]">
              iTravas
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${isActive(link.href)
                ? ' text-[#08A6F6]'
                : 'text-[#484848] hover:text-[#08A6F6] hover:bg-[#C0DFED]/30'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/passenger/notifications"
            className="relative p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors group"
            aria-label="Notifications"
          >
            <IoNotificationsOff className="text-2xl text-[#484848] group-hover:text-[#08A6F6] transition-colors" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] flex items-center justify-center text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#08A6F6] focus:ring-offset-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                if (hasUser) setDropdownOpen(!dropdownOpen);
              }}
              aria-label="User menu"
            >
              {getInitials(user?.first_name, user?.last_name)}
            </button>
            {dropdownOpen && hasUser && (
              <div className="absolute right-0 mt-3 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#C0DFED]/20">
                  <p className="text-sm font-semibold text-[#00204a]">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-[#828282] truncate">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/passenger/profile"
                  className="block px-4 py-2.5 text-sm text-[#484848] hover:bg-[#C0DFED]/30 hover:text-[#08A6F6] transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  View Profile
                </Link>
                <button
                  className="block w-full text-left px-4 py-2.5 text-sm text-[#08A6F6] font-medium hover:bg-[#C0DFED]/30 transition-colors border-t border-[#E5E7EB]"
                  onClick={async () => {
                    setDropdownOpen(false);
                    try {
                      await switchRole();
                      router.push('/dashboard/driver');
                    } catch (error) {
                      console.error('Failed to switch to driver mode:', error);
                    }
                  }}
                >
                  Switch to Driver Mode
                </button>
                <button
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#E5E7EB]"
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

      {/* Main Content - NO PADDING */}
      <main>
        {children}
      </main>
    </div>
  );
}