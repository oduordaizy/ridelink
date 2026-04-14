'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
];

interface AdminSidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        // outer wrapper handles mobile slide-in/out
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#00204a] text-white min-h-screen flex flex-col shadow-xl transform transition-transform duration-200
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:w-56 lg:w-64`}
        >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
                <Link href="/" className="flex items-center space-x-2 group">
                    <Image src="/footer-logo.png" alt="iTravas Logo" width={28} height={28} className="transition-transform group-hover:scale-105" />
                    {/* <span className="text-base md:text-lg lg:text-xl font-semibold text-[#08A6F6] tracking-tight">iTravas Admin</span> */}
                </Link>
                {/* close button for mobile */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-gray-400 hover:text-white"
                        aria-label="Close menu"
                    >
                        <IoChevronBack />
                    </button>
                )}
            </div>

            <nav className="flex-1 mt-4 md:mt-6 px-2 md:px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center space-x-3 px-3 md:px-4 py-3 rounded-lg md:rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-[#08A6F6] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`text-lg md:text-xl flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className="font-medium text-sm md:text-base">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 md:p-6 border-t border-white/10">
                <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex items-center space-x-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <IoChevronBack />
                    <span>Back</span>
                </Link>
            </div>
        </aside>
    );
}
