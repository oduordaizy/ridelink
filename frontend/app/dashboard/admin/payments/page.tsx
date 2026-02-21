'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../../services/api';
import { IoCash, IoTime, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

interface Transaction {
    id: number;
    user: string;
    amount: number;
    status: string;
    receipt: string | null;
    description: string | null;
    date: string;
}

export default function AdminPayments() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.is_staff) {
                router.push('/dashboard');
                return;
            }

            async function loadTransactions() {
                if (!token) {
                    setLoading(false);
                    return;
                }
                try {
                    const data = await adminAPI.getTransactions(token);
                    setTransactions(data);
                } catch (error) {
                    console.error('Failed to load transactions:', error);
                } finally {
                    setLoading(false);
                }
            }
            loadTransactions();
        }
    }, [token, user, authLoading, router]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#00204a]">Financial Reports</h1>
                    <p className="text-gray-500 text-sm">Monitor all platform transactions and payment health.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">M-Pesa Receipt</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No transactions recorded.</td></tr>
                            ) : transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">#{t.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#00204a]">{t.user}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#08A6F6]">KSh {t.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center space-x-1 text-xs font-bold ${t.status === 'success' ? 'text-emerald-600' : t.status === 'failed' ? 'text-red-500' : 'text-blue-500'
                                            }`}>
                                            {t.status === 'success' ? <IoCheckmarkCircle className="text-lg" /> : t.status === 'failed' ? <IoCloseCircle className="text-lg" /> : <IoTime className="text-lg" />}
                                            <span className="capitalize">{t.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{t.receipt || '--'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(t.date).toLocaleString()}
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
