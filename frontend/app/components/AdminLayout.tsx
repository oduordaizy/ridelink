'use client';

import React from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { IoNotifications, IoSearch, IoLogOut } from 'react-icons/io5';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const [mobileMenu, setMobileMenu] = React.useState(false);

    const toggleMenu = () => setMobileMenu((v) => !v);
    const closeMenu = () => setMobileMenu(false);

    return (
        <div className="relative flex min-h-screen bg-gray-50">
            {/* overlay when mobile menu open */}
            {mobileMenu && <div onClick={closeMenu} className="fixed inset-0 bg-black/40 z-20 md:hidden" />}
            <AdminSidebar mobileOpen={mobileMenu} onClose={closeMenu} />

            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="min-h-16 bg-white border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between px-3 sm:px-6 md:px-8 py-3 md:py-0 sticky top-0 z-10 gap-3 md:gap-0">
                    <button
                        onClick={toggleMenu}
                        className="md:hidden p-2 text-gray-500 hover:text-[#08A6F6] transition-colors"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="relative w-full md:w-80 lg:w-96">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#08A6F6] transition-all"
                        />
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 w-full md:w-auto justify-end">
                        <button className="relative p-2 text-gray-500 hover:text-[#08A6F6] transition-colors hidden sm:flex">
                            <IoNotifications className="text-xl" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center space-x-2 md:space-x-3 md:border-l md:pl-6 md:border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs md:text-sm font-bold text-[#00204a]">{user?.first_name}</p>
                                <p className="text-xs text-emerald-600 font-semibold px-2 py-0.5 bg-green-50 rounded-full inline-block">Admin</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <IoLogOut className="text-xl md:text-2xl" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
