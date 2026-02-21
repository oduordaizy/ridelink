'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllRides } from '../../../services/api';
import { IoCar, IoCalendar, IoLocation, IoPeople } from 'react-icons/io5';

interface AdminRide {
    id: number;
    departure_location: string;
    destination: string;
    departure_time: string;
    price: string;
    status: string;
    available_seats: number;
    driver: { username: string };
}

export default function AdminRides() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [rides, setRides] = useState<AdminRide[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.is_staff) {
                router.push('/dashboard');
                return;
            }

            async function loadRides() {
                try {
                    const data = await getAllRides();
                    setRides(data);
                } catch (error) {
                    console.error('Failed to load rides:', error);
                } finally {
                    setLoading(false);
                }
            }
            loadRides();
        }
    }, [authLoading, user, router]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#00204a]">Rides & Bookings</h1>
                    <p className="text-gray-500 text-sm">Monitor all trip activity across the platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-medium">Loading platform rides...</div>
                    ) : rides.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-medium">No rides available.</div>
                    ) : rides.map((ride) => (
                        <div key={ride.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="px-2 py-1 bg-blue-50 text-[#08A6F6] text-[10px] font-bold rounded uppercase">
                                        ID: #{ride.id}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${ride.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {ride.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                            <IoLocation />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Route</p>
                                            <p className="text-sm font-bold text-[#00204a]">{ride.departure_location} → {ride.destination}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                                <IoCalendar />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Departure</p>
                                                <p className="text-sm font-bold text-[#00204a]">{new Date(ride.departure_time).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right font-bold text-[#08A6F6]">
                                            KSh {ride.price}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-[#00204a] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {ride.driver.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">@{ride.driver.username}</span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 flex items-center space-x-1">
                                        <IoPeople />
                                        <span>{ride.available_seats} Seats</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
