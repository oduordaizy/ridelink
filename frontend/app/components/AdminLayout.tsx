'use client';

import React from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { IoNotifications, IoSearch, IoLogOut } from 'react-icons/io5';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="relative w-96">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users, rides, transactions..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#08A6F6] transition-all"
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        <button className="relative p-2 text-gray-500 hover:text-[#08A6F6] transition-colors">
                            <IoNotifications className="text-xl" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center space-x-3 border-l pl-6 border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#00204a]">{user?.first_name} {user?.last_name}</p>
                                <p className="text-xs text-emerald-600 font-semibold px-2 py-0.5 bg-green-50 rounded-full inline-block">Administrator</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <IoLogOut className="text-2xl" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="p-8 flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
