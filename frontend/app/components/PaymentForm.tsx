'use client';

import React, { useState } from 'react';
import { FaPhone, FaSpinner, FaChevronRight } from 'react-icons/fa';
import { paymentAPI, API_BASE_URL } from '@/app/services/api';
import { stkPushQuery } from '@/app/actions/stkPushQuery';
import STKPushQueryLoading from './StkQueryLoading';
import PaymentSuccess from './Success';
import toast from 'react-hot-toast';

interface PaymentFormProps {
    rideId: number;
    amount: number;
    token: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    seats?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ rideId, amount, token, onSuccess, onCancel, seats = 1 }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [stkQueryLoading, setStkQueryLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    // Poll for STK status
    const stkPushQueryWithIntervals = (checkoutRequestId: string) => {
        let currentAttempt = 0;
        const STILL_PROCESSING_CODES = ['500.001.1001', '500.001.1000'];
        const MAX_ATTEMPTS = 25; // 25 × 3s = 75 seconds total

        const timer = setInterval(async () => {
            currentAttempt += 1;
            setAttempt(currentAttempt);

            if (currentAttempt >= MAX_ATTEMPTS) {
                clearInterval(timer);
                setStkQueryLoading(false);
                setLoading(false);
                setErrorMessage("You took too long to pay. If you have paid, your balance will reflect shortly.");
                return;
            }

            const { data, error } = await stkPushQuery(checkoutRequestId, token);

            if (error) {
                const errorData = error.response?.data;
                const errorCode = String(errorData?.errorCode || '');

                if (errorCode && !STILL_PROCESSING_CODES.includes(errorCode)) {
                    // Only stop on a definitive failure code — not on 'still processing'
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    const msg = errorData?.errorMessage || errorData?.error || errorData?.ResultDesc || "An error occurred while checking status";
                    setErrorMessage(msg);
                }
                // Otherwise (500.001.1001 or unknown transient), keep polling
                return;
            }

            if (data) {
                // internal_status is set by our backend and is the most reliable source
                if (data.internal_status === "success") {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setSuccess(true);
                    if (onSuccess) onSuccess();
                    return;
                } else if (data.internal_status === "failed") {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setErrorMessage(data.internal_result_desc || data?.ResultDesc || "Transaction failed");
                    return;
                }

                // If internal_status is 'pending', Daraja is still processing — keep polling
                if (data.internal_status === 'pending') {
                    return;
                }

                // Fallback: use raw M-Pesa ResultCode only when it's a definitive final code
                const resultCode = data.ResultCode;
                const mpesaErrorCode = String(data.errorCode || '');

                if (STILL_PROCESSING_CODES.includes(mpesaErrorCode)) {
                    return; // Still processing, keep polling
                }

                if (resultCode !== undefined && resultCode !== null) {
                    if (String(resultCode) === "0") {
                        clearInterval(timer);
                        setStkQueryLoading(false);
                        setLoading(false);
                        setSuccess(true);
                        if (onSuccess) onSuccess();
                    } else {
                        clearInterval(timer);
                        setStkQueryLoading(false);
                        setLoading(false);
                        setErrorMessage(data?.ResultDesc || `Transaction failed (Error: ${resultCode})`);
                    }
                }
            }
        }, 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setLoading(true);

        try {
            // First, create the booking to get a valid booking_id
            const bookingRes = await fetch(`${API_BASE_URL}/rides/${rideId}/book/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_method: 'mpesa',
                    no_of_seats: seats
                }),
            });

            if (!bookingRes.ok) {
                const errorData = await bookingRes.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }

            const bookingData = await bookingRes.json();
            const actualBookingId = bookingData.booking_id || bookingData.id;

            // Then initiate M-Pesa payment
            const res = await paymentAPI.initiateMpesaPayment(token, {
                phone_number: phoneNumber,
                amount: amount,
                booking_id: actualBookingId,
            });

            if (res.checkout_request_id) {
                toast.success('STK Push initiated!');
                setStkQueryLoading(true);
                stkPushQueryWithIntervals(res.checkout_request_id);
            } else {
                throw new Error('No checkout request ID received');
            }
        } catch (error: any) {
            setLoading(false);
            const msg = error.message || 'Failed to initiate payment';
            setErrorMessage(msg);
            toast.error(msg);
        }
    };

    if (stkQueryLoading) {
        return <STKPushQueryLoading number={phoneNumber} attempt={attempt} />;
    }

    if (success) {
        return (
            <PaymentSuccess
                title="Booking Successful! 🎉"
                message={`Your ride booking for ${seats} seat(s) has been confirmed. You paid KES ${amount}.`}
                viewLink="/dashboard/passenger/bookings"
                viewLabel="View My Bookings"
                continueLabel="Book Another Ride"
                onContinue={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">M-Pesa Payment</h2>
                <p className="text-gray-600">Enter your M-Pesa number to receive an STK push</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaPhone className="text-sm" />
                        </div>
                        <input
                            type="tel"
                            required
                            placeholder="e.g. 0712345678"
                            className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl focus:border-green-500 focus:ring-0 transition-all text-black"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Amount to pay: <span className="font-bold text-gray-800">KES {amount}</span></p>
                </div>

                {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                        {errorMessage}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <>
                                Pay with M-Pesa
                                <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentForm;
