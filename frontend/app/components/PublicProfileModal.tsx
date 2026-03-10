'use client'
import React, { useEffect, useState } from 'react';
import { FaTimes, FaStar, FaCar, FaCalendarAlt, FaUser, FaQuoteLeft } from 'react-icons/fa';
import { API_BASE_URL, getMediaUrl } from '@/app/services/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Review {
    id: number;
    reviewer_name: string;
    reviewer_profile_pic: string | null;
    rating: number;
    comment: string;
    created_at: string;
}

interface PublicProfile {
    id: number;
    username: string;
    full_name: string;
    profile_picture: string | null;
    driver_profile?: {
        vehicle_model: string;
        vehicle_color: string;
        vehicle_plate: string;
        rating: number;
    };
    reviews_received: Review[];
    created_at: string;
}

interface PublicProfileModalProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
}

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, isOpen, onClose }) => {
    const { token } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching public profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#00204a] to-[#08A6F6] p-6 text-white relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <FaTimes size={20} />
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {profile?.profile_picture ? (
                                <img
                                    src={getMediaUrl(profile.profile_picture)}
                                    alt={profile.username}
                                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white border-4 border-white/20 shadow-xl font-bold text-3xl">
                                    {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{profile?.full_name || 'Loading...'}</h3>
                            <p className="text-white/80">@{profile?.username}</p>
                            {profile?.driver_profile && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} className={i < Math.round(profile?.driver_profile?.rating || 0) ? 'fill-current' : 'text-white/20'} />
                                        ))}
                                    </div>
                                    <span className="font-bold">{(profile?.driver_profile?.rating || 0).toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-[#08A6F6] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Fetching profile details...</p>
                        </div>
                    ) : (
                        <>
                            {/* Driver Info Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile?.driver_profile && (
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#08A6F6] flex items-center justify-center shrink-0">
                                            <FaCar size={20} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Vehicle</label>
                                            <p className="font-bold text-gray-700">{profile.driver_profile.vehicle_color} {profile.driver_profile.vehicle_model}</p>
                                            <p className="text-xs text-gray-500">{profile.driver_profile.vehicle_plate}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                        <FaCalendarAlt size={20} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Member Since</label>
                                        <p className="font-bold text-gray-700">{profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section - Only show for drivers */}
                            {profile?.driver_profile && (
                                <div>
                                    <h4 className="text-lg font-bold text-[#00204a] mb-4 flex items-center gap-2">
                                        <FaQuoteLeft className="text-[#08A6F6]" />
                                        What Passengers Say
                                    </h4>
                                    {profile?.reviews_received && profile.reviews_received.length > 0 ? (
                                        <div className="space-y-4">
                                            {profile.reviews_received.map((review) => (
                                                <div key={review.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:border-[#08A6F6]/30">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                                {review.reviewer_profile_pic ? (
                                                                    <img src={getMediaUrl(review.reviewer_profile_pic)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <FaUser className="text-gray-400 text-xs" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{review.reviewer_name}</p>
                                                                <p className="text-[10px] text-gray-400">{format(new Date(review.created_at), 'MMM dd, yyyy')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex text-yellow-400 text-xs">
                                                            {[...Array(5)].map((_, i) => (
                                                                <FaStar key={i} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {review.comment && review.comment.trim() && (
                                                        <p className="text-gray-600 text-sm italic leading-relaxed">"{review.comment.trim()}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-gray-400">No reviews yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfileModal;
