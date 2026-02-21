'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../services/api';
import {
    IoCash,
    IoPeople,
    IoCar,
    IoCheckmarkCircle,
    IoAlertCircle,
    IoTrendingUp,
    IoTrendingDown
} from 'react-icons/io5';

interface Stats {
    users: { total: number; drivers: number; passengers: number; new_today: number };
    rides: { total: number; active: number; total_bookings: number; confirmed_bookings: number };
    financials: { total_revenue: number; transaction_volume: number; success_rate: number };
    payments: { successful: number; failed: number };
}

export default function AdminDashboard() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.is_staff) {
                router.push('/dashboard');
                return;
            }

            async function loadStats() {
                if (!token) {
                    setLoading(false);
                    return;
                }
                try {
                    const data = await adminAPI.getStats(token);
                    setStats(data);
                } catch (error) {
                    console.error('Failed to load admin stats:', error);
                } finally {
                    setLoading(false);
                }
            }
            loadStats();
        }
    }, [token, user, authLoading, router]);

    if (authLoading || (loading && !stats)) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00204a]"></div>
            </div>
        </AdminLayout>
    );

    const statCards = [
        { title: 'Total Revenue', value: `KSh ${stats?.financials.total_revenue.toLocaleString()}`, icon: IoCash, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', trendUp: true },
        { title: 'Active Rides', value: stats?.rides.active, icon: IoCar, color: 'text-green-600', bg: 'bg-green-50', trend: '+5%', trendUp: true },
        { title: 'Total Users', value: stats?.users.total, icon: IoPeople, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+18%', trendUp: true },
        { title: 'Payment Success', value: `${stats?.financials.success_rate.toFixed(1)}%`, icon: IoCheckmarkCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-2%', trendUp: false },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#00204a]">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm">Welcome back, here's what's happening on iTravas today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.bg} ${card.color} p-3 rounded-xl`}>
                                    <card.icon className="text-2xl" />
                                </div>
                                <div className={`flex items-center space-x-1 text-sm font-bold ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {card.trendUp ? <IoTrendingUp /> : <IoTrendingDown />}
                                    <span>{card.trend}</span>
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
                            <p className="text-2xl font-bold text-[#00204a] mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Middle Section: Platform Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-[#00204a] mb-6">Recent Platform Activity</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                                        <IoPeople />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#00204a]">{stats?.users.new_today} New Registrations</p>
                                        <p className="text-xs text-gray-400">Since 12:00 AM today</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-[#08A6F6] hover:underline">View All</button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                        <IoCash />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#00204a]">{stats?.payments.failed} Failed Payments</p>
                                        <p className="text-xs text-gray-400">Needs investigation</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-red-500 hover:underline">Review Now</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#00204a] p-8 rounded-2xl shadow-sm text-white">
                        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors text-left px-4 flex items-center space-x-3">
                                <span className="w-2 h-2 bg-[#08A6F6] rounded-full"></span>
                                <span>Verify Pending Drivers</span>
                            </button>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors text-left px-4 flex items-center space-x-3">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>Export Monthly Report</span>
                            </button>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors text-left px-4 flex items-center space-x-3">
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                <span>System Health Check</span>
                            </button>
                        </div>

                        <div className="mt-12 p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">Server Status</span>
                                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span>Healthy</span>
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">All systems operational in Nairobi East region.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
