'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../../services/api';
import { IoCheckmarkCircle, IoCloseCircle, IoEllipsisVertical, IoCar } from 'react-icons/io5';

interface AdminDriver {
    id: number;
    username: string;
    email: string;
    type: string;
    is_verified: boolean;
    date_joined: string;
    phone_number: string;
    license_number: string | null;
    vehicle_plate: string | null;
}

export default function AdminDrivers() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [drivers, setDrivers] = useState<AdminDriver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.is_staff) {
                router.push('/dashboard');
                return;
            }

            async function loadDrivers() {
                if (!token) {
                    setLoading(false);
                    return;
                }
                try {
                    const data = await adminAPI.getUsers(token, 'driver');
                    setDrivers(data);
                } catch (error) {
                    console.error('Failed to load drivers:', error);
                } finally {
                    setLoading(false);
                }
            }
            loadDrivers();
        }
    }, [token, user, authLoading, router]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#00204a]">Driver Management</h1>
                        <p className="text-gray-500 text-sm">Verify and manage platform drivers and their vehicles.</p>
                    </div>
                    <button className="bg-[#08A6F6] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#00204a] transition-colors">
                        Export Driver List
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">License & Vehicle</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Verification</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Loading drivers...</td></tr>
                            ) : drivers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No drivers found.</td></tr>
                            ) : drivers.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-purple-100 text-[#00204a] rounded-full flex items-center justify-center font-bold text-sm">
                                                {d.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#00204a]">{d.username}</p>
                                                <p className="text-xs text-gray-400">{d.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-600">ID: {d.license_number || 'N/A'}</p>
                                            <div className="flex items-center text-[10px] font-bold text-[#08A6F6] uppercase">
                                                <IoCar className="mr-1" />
                                                {d.vehicle_plate || 'No Plate'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {d.is_verified ? (
                                            <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                                                <IoCheckmarkCircle className="text-lg" />
                                                <span>Verified</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-1 text-orange-400 text-xs font-bold">
                                                <IoCloseCircle className="text-lg" />
                                                <span>Pending Audit</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(d.date_joined).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-[#00204a] rounded-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                                            <IoEllipsisVertical />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
