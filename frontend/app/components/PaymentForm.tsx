'use client';

import React, { useState } from 'react';
import { FaPhone, FaSpinner, FaChevronRight } from 'react-icons/fa';
import { paymentAPI } from '@/app/services/api';
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
}

const PaymentForm: React.FC<PaymentFormProps> = ({ rideId, amount, token, onSuccess, onCancel }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [stkQueryLoading, setStkQueryLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Poll for STK status
    let reqcount = 0;
    const stkPushQueryWithIntervals = (checkoutRequestId: string) => {
        const timer = setInterval(async () => {
            reqcount += 1;

            if (reqcount === 15) {
                clearInterval(timer);
                setStkQueryLoading(false);
                setLoading(false);
                setErrorMessage("You took too long to pay. Please try again.");
                return;
            }

            const { data, error } = await stkPushQuery(checkoutRequestId);

            if (error) {
                // If it's a "Wait" error from M-Pesa, keep polling
                if (error.response?.data?.errorCode !== "500.001.1001") {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setErrorMessage(error?.response?.data?.errorMessage || "An error occurred while checking status");
                }
            }

            if (data) {
                if (data.ResultCode === "0") {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setSuccess(true);
                    if (onSuccess) onSuccess();
                } else if (data.ResultCode) {
                    // This handles cases where ResultCode is non-zero (failed, cancelled)
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setErrorMessage(data?.ResultDesc || "Transaction failed or was cancelled");
                }
                // If ResultCode is null but response is OK, it means it's still processing
            }
        }, 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setLoading(true);

        try {
            const res = await paymentAPI.initiateMpesaPayment(token, {
                phone_number: phoneNumber,
                amount: amount,
                booking_id: rideId, // Using rideId as booking_id for now if booking is created after payment, or if booking exists
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
            setErrorMessage(error.message || 'Failed to initiate payment');
            toast.error(error.message || 'Failed to initiate payment');
        }
    };

    if (stkQueryLoading) {
        return <STKPushQueryLoading number={phoneNumber} />;
    }

    if (success) {
        return <PaymentSuccess />;
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
