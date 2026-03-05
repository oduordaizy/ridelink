'use client';

import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '@/app/services/api';
import { toast } from 'react-toastify';

interface ReviewFormProps {
    bookingId: number;
    onClose: () => void;
    onSuccess: () => void;
    revieweeName: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ bookingId, onClose, onSuccess, revieweeName }) => {
    const [rating, setRating] = useState<number>(5);
    const [hover, setHover] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reviews/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    booking: bookingId,
                    rating,
                    comment,
                }),
            });

            if (response.ok) {
                toast.success('Review submitted successfully!');
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                toast.error(data.detail || data.non_field_errors?.[0] || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white">
                    <h3 className="text-xl font-bold">Review {revieweeName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">How was your experience?</p>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <FaStar
                                        className={`w-10 h-10 ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-200'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-500">
                            {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Comments (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us more about the ride..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#08A6F6] outline-none transition-all h-32 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-[#08A6F6] to-[#00204a] text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewForm;
