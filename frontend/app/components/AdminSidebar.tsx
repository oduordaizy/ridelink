'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IoStatsChart,
    IoPeople,
    IoCarSport,
    IoCash,
    IoSettings,
    IoChevronBack,
    IoSyncCircle
} from 'react-icons/io5';

const menuItems = [
    { href: '/dashboard/admin', label: 'Overview', icon: IoStatsChart },
    { href: '/dashboard/admin/drivers', label: 'Drivers', icon: IoCarSport },
    { href: '/dashboard/admin/passengers', label: 'Passengers', icon: IoPeople },
    { href: '/dashboard/admin/rides', label: 'Rides & Bookings', icon: IoCarSport },
    { href: '/dashboard/admin/payments', label: 'Payments', icon: IoCash },
    { href: '/dashboard/admin/settings', label: 'System Settings', icon: IoSettings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-[#00204a] text-white min-h-screen flex flex-col shadow-xl">
            <div className="p-6 flex items-center space-x-2 border-b border-white/10">
                <div className="w-8 h-8 bg-[#08A6F6] rounded-lg flex items-center justify-center">
                    <IoSyncCircle className="text-2xl text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Admin <span className="text-[#08A6F6]">Panel</span></span>
            </div>

            <nav className="flex-1 mt-6 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-[#08A6F6] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`text-xl ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/10">
                <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <IoChevronBack />
                    <span>Back to Dashboard</span>
                </Link>
            </div>
        </aside>
    );
}
