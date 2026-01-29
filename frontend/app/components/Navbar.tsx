'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href='/' className='pacifico-regular flex items-center text-[#08A6F6] hover:opacity-90 transition-opacity'>
            <Image src="/logo.png" alt="Logo" width={35} height={35} className="!m-0" />
            <span className="ml-0 font-semibold text-2xl">Travas</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              <Link href="/" className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Home
              </Link>
              <Link href="/how-it-works" className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                How it Works
              </Link>
              <Link href="/about" className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                About
              </Link>
              <Link href="/contact" className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Contact
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user && user.id ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard"
                  className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  My Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C0DFED] rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-[#08A6F6] flex items-center justify-center text-white text-xs font-semibold">
                    {user.first_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[#003870] text-sm font-medium">
                    {user.first_name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-5 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#08A6F6] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#00204a] transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#08A6F6] transition-all"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] block px-4 py-2.5 rounded-lg text-base font-medium transition-all"
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] block px-4 py-2.5 rounded-lg text-base font-medium transition-all"
            >
              How it Works
            </Link>
            <Link
              href="/about"
              className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] block px-4 py-2.5 rounded-lg text-base font-medium transition-all"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] block px-4 py-2.5 rounded-lg text-base font-medium transition-all"
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-[#E5E7EB]">
            <div className="flex flex-col space-y-2 px-3">
              {user && user.id ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#C0DFED] rounded-lg mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#08A6F6] flex items-center justify-center text-white text-sm font-semibold">
                      {user.first_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[#003870] text-sm font-medium">
                      Welcome, {user.first_name}!
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2.5 rounded-lg font-medium transition-all text-left"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2.5 rounded-lg font-medium transition-all text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-[#484848] hover:text-[#08A6F6] hover:bg-[#F5F5F5] px-4 py-2.5 rounded-lg font-medium transition-all text-left"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-[#08A6F6] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#00204a] transition-all shadow-md text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}