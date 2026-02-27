'use client';

import React, { useEffect, useState } from 'react';
import { authAPI } from '@/app/services/api';
import { FaBell, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTrashAlt } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    is_read: boolean;
    created_at: string;
}

export default function NotificationList({ backHref }: { backHref: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const data = await authAPI.getNotifications(token);
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await authAPI.markNotificationRead(token, id);
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await authAPI.markAllNotificationsRead(token);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                toast.success('All marked as read');
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <FaCheckCircle className="text-green-500 text-xl" />;
            case 'error': return <FaTimesCircle className="text-red-500 text-xl" />;
            default: return <FaInfoCircle className="text-blue-500 text-xl" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08A6F6]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#013C5E] flex items-center gap-2">
                    <FaBell className="text-[#08A6F6]" />
                    Notifications
                </h1>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-[#08A6F6] hover:underline font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border-2 border-dashed border-gray-100">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBell className="text-gray-300 text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">No notifications yet</h3>
                    <p className="text-gray-500 mt-2">We'll notify you when something important happens.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${notification.is_read
                                    ? 'bg-white border-gray-100 opacity-75'
                                    : 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className="mt-1">{getIcon(notification.type)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${notification.is_read ? 'text-gray-700' : 'text-[#013C5E]'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {!notification.is_read && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500">New</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
