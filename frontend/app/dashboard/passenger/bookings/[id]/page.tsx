'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaClock, FaMoneyBillWave, FaArrowLeft, FaChevronLeft, FaPhone, FaEnvelope, FaInfoCircle, FaImage } from 'react-icons/fa';
import Link from 'next/link';
import { API_BASE_URL, getMediaUrl } from '@/app/services/api';
import toast, { Toaster } from 'react-hot-toast';

interface BookingDetail {
    id: number;
    ride: number;
    ride_details: {
        id: number;
        departure_location: string;
        destination: string;
        departure_time: string;
        price: number;
        available_seats: number;
        additional_info?: string;
        driver: {
            username: string;
            email?: string;
            phone_number?: string;
            first_name?: string;
            last_name?: string;
            profile_picture?: string;
        };
        images: {
            id: number;
            image: string;
        }[];
    };
    no_of_seats: number;
    total_price: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    is_paid: boolean;
    booked_at: string;
    updated_at: string;
}

const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
    completed: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

export default function BookingDetailPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        } else if (user && id) {
            fetchBookingDetails();
        }
    }, [user, isLoading, id, router]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/bookings/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBooking(data);
            } else {
                const errorData = await response.json();
                toast.error(errorData.detail || 'Failed to fetch booking details');
                router.push('/dashboard/passenger/bookings');
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('An error occurred while fetching booking details');
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async () => {
        if (!booking) return;

        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}/cancel/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    toast.success('Booking cancelled successfully');
                    fetchBookingDetails();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.detail || 'Failed to cancel booking');
                }
            } catch (error) {
                console.error('Error cancelling booking:', error);
                toast.error('An error occurred while cancelling the booking');
            }
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#C0DFED] rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-[#08A6F6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-[#484848] font-medium">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#00204a] mb-4">Booking not found</h2>
                    <Link href="/dashboard/passenger/bookings" className="text-[#08A6F6] font-bold hover:underline">
                        Back to My Bookings
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Toaster position="top-right" />

            {/* Dynamic Header */}
            <div className="bg-gradient-to-r from-[#08A6F6] to-[#00204a] pt-12 pb-24 px-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#C0DFED] blur-3xl opacity-20"></div>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/dashboard/passenger/bookings"
                            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
                        >
                            <FaArrowLeft /> Back
                        </Link>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${statusColors[booking.status].includes('yellow') ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30' : statusColors[booking.status].includes('red') ? 'bg-red-400/20 text-red-200 border-red-400/30' : 'bg-green-400/20 text-green-200 border-green-400/30'}`}>
                            {booking.status}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Booking <span className="text-[#C0DFED]">#{booking.id}</span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-blue-100 text-lg">
                        <span className="flex items-center gap-2"><FaMapMarkerAlt /> {booking.ride_details.departure_location}</span>
                        <span className="text-blue-300">→</span>
                        <span className="flex items-center gap-2"><FaMapMarkerAlt /> {booking.ride_details.destination}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left Column: Ride & Payment Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#00204a] mb-6 flex items-center gap-2">
                                <FaCar className="text-[#08A6F6]" /> Ride Information
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Departure</label>
                                        <p className="text-lg font-bold text-[#00204a]">{booking.ride_details.departure_location}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Destination</label>
                                        <p className="text-lg font-bold text-[#00204a]">{booking.ride_details.destination}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Date & Time</label>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                <FaCalendarAlt className="text-[#08A6F6]" />
                                                <span className="font-semibold">{new Date(booking.ride_details.departure_time).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                <FaClock className="text-[#08A6F6]" />
                                                <span className="font-semibold">{new Date(booking.ride_details.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Seats Booked</label>
                                        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#08A6F6] font-bold px-4 py-2 rounded-xl border border-blue-100">
                                            <FaUser /> {booking.no_of_seats} {booking.no_of_seats === 1 ? 'Seat' : 'Seats'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Fare</label>
                                        <div className="text-2xl font-black text-[#00204a] flex items-baseline gap-1">
                                            <span className="text-sm font-bold text-gray-400">KSh</span>
                                            {booking.total_price.toLocaleString()}
                                        </div>
                                        {booking.is_paid && (
                                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                ✓ Payment Confirmed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {booking.ride_details.additional_info && (
                                <div className="mt-8 pt-8 border-t border-gray-50">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Additional Info</label>
                                    <div className="bg-gray-50/50 p-4 rounded-2xl text-gray-600 leading-relaxed italic border border-gray-100 flex gap-3">
                                        <FaInfoCircle className="text-gray-300 mt-1 flex-shrink-0" />
                                        "{booking.ride_details.additional_info}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ride Images */}
                        {booking.ride_details.images && booking.ride_details.images.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 border border-gray-100">
                                <h2 className="text-xl font-bold text-[#00204a] mb-6 flex items-center gap-2">
                                    <FaImage className="text-[#08A6F6]" /> Vehicle Photos
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {booking.ride_details.images.map((img) => (
                                        <div key={img.id} className="aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-zoom-in">
                                            <img
                                                src={getMediaUrl(img.image, 'vehicle')}
                                                alt="Vehicle"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Driver & Actions */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 border border-gray-100 text-center">
                            <div className="relative inline-block mb-4">
                                {getMediaUrl(booking.ride_details.driver.profile_picture) ? (
                                    <img
                                        src={getMediaUrl(booking.ride_details.driver.profile_picture)}
                                        alt={booking.ride_details.driver.username}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#08A6F6] to-[#00204a] text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg mx-auto">
                                        {booking.ride_details.driver.first_name ? booking.ride_details.driver.first_name.charAt(0).toUpperCase() : booking.ride_details.driver.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                            </div>

                            <h3 className="text-xl font-bold text-[#00204a]">
                                {booking.ride_details.driver.first_name || booking.ride_details.driver.username} {booking.ride_details.driver.last_name}
                            </h3>
                            <p className="text-gray-400 text-sm font-medium mb-6">@{booking.ride_details.driver.username}</p>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 group transition-colors hover:bg-blue-50/50 hover:border-blue-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-[#08A6F6] flex items-center justify-center shadow-sm">
                                        <FaPhone />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block leading-none mb-1">Phone</label>
                                        <span className="text-gray-700 font-bold">{booking.ride_details.driver.phone_number || 'Not provided'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 group transition-colors hover:bg-blue-50/50 hover:border-blue-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-[#08A6F6] flex items-center justify-center shadow-sm">
                                        <FaEnvelope />
                                    </div>
                                    <div className="overflow-hidden">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block leading-none mb-1">Email</label>
                                        <span className="text-gray-700 font-bold truncate block">{booking.ride_details.driver.email || 'Not provided'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {booking.status === 'pending' && (
                                <button
                                    onClick={cancelBooking}
                                    className="w-full py-4 rounded-3xl bg-white border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel Booking
                                </button>
                            )}

                            <Link
                                href="/dashboard/passenger/bookings"
                                className="block w-full py-4 text-center rounded-3xl bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 transition-all active:scale-95"
                            >
                                Back to List
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
