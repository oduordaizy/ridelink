'use client';

import React, { useState } from 'react';
import { FaPhone, FaSpinner, FaCreditCard, FaTimes } from 'react-icons/fa';
import { paymentAPI } from '@/app/services/api';
import { stkPushQuery } from '@/app/actions/stkPushQuery';
import STKPushQueryLoading from './StkQueryLoading';
import PaymentSuccess from './Success';
import toast from 'react-hot-toast';

interface RetryPaymentModalProps {
    bookingId: number;
    amount: number;
    token: string;
    rideId?: number;
    onSuccess?: () => void;
    onClose: () => void;
}

const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
    bookingId,
    amount,
    token,
    rideId,
    onSuccess,
    onClose,
}) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [stkQueryLoading, setStkQueryLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    const stkPushQueryWithIntervals = (checkoutRequestId: string) => {
        let currentAttempt = 0;
        const STILL_PROCESSING_CODES = ['500.001.1001', '500.001.1000', '1'];
        const MAX_ATTEMPTS = 25; // 25 × 3s = 75 seconds

        const timer = setInterval(async () => {
            currentAttempt += 1;
            setAttempt(currentAttempt);

            if (currentAttempt >= MAX_ATTEMPTS) {
                clearInterval(timer);
                setStkQueryLoading(false);
                setLoading(false);
                setErrorMessage(
                    'You took too long to pay. If you have paid, your booking status will update shortly.'
                );
                return;
            }

            const { data, error } = await stkPushQuery(checkoutRequestId, token);

            if (error) {
                const errorData = error.response?.data;
                const errorCode = String(errorData?.errorCode || '');

                if (errorCode && !STILL_PROCESSING_CODES.includes(errorCode)) {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);

                    let msg =
                        errorData?.errorMessage ||
                        errorData?.error ||
                        errorData?.ResultDesc ||
                        'An error occurred while checking payment status';

                    if (errorCode === '1037' || /timeout|reached/i.test(msg)) {
                        msg =
                            'Safaricom could not reach your phone. Please ensure your phone is ON, has signal, and the SIM card is M-Pesa active.';
                    }

                    setErrorMessage(msg);
                }
                return;
            }

            if (data) {
                if (data.internal_status === 'success') {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setSuccess(true);
                    if (onSuccess) onSuccess();
                    return;
                }

                if (data.internal_status === 'failed') {
                    clearInterval(timer);
                    setStkQueryLoading(false);
                    setLoading(false);
                    setErrorMessage(
                        data.internal_result_desc || data?.ResultDesc || 'Transaction failed'
                    );
                    return;
                }

                if (data.internal_status === 'pending') return;

                const resultCode = data.ResultCode;
                const mpesaErrorCode = String(data.errorCode || '');

                if (
                    STILL_PROCESSING_CODES.includes(mpesaErrorCode) ||
                    /processing/i.test(data?.ResultDesc || '')
                ) {
                    return;
                }

                if (resultCode !== undefined && resultCode !== null) {
                    if (String(resultCode) === '0') {
                        clearInterval(timer);
                        setStkQueryLoading(false);
                        setLoading(false);
                        setSuccess(true);
                        if (onSuccess) onSuccess();
                    } else {
                        clearInterval(timer);
                        setStkQueryLoading(false);
                        setLoading(false);
                        setErrorMessage(
                            data?.ResultDesc || `Transaction failed (Error: ${resultCode})`
                        );
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
            // For retry, we already have a booking — just initiate M-Pesa payment
            const res = await paymentAPI.initiateMpesaPayment(token, {
                phone_number: phoneNumber,
                amount: amount,
                booking_id: rideId ? undefined : bookingId,
                ride_id: rideId,
            });

            if (res.checkout_request_id) {
                toast.success('STK Push sent! Check your phone to confirm payment.');
                setStkQueryLoading(true);
                stkPushQueryWithIntervals(res.checkout_request_id);
            } else {
                throw new Error('No checkout request ID received from M-Pesa');
            }
        } catch (error: any) {
            setLoading(false);
            const msg = error.message || 'Failed to initiate payment. Please try again.';
            setErrorMessage(msg);
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                style={{ animation: 'slideUp 0.25s ease' }}
            >
                {/* Header */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #00204a 0%, #08A6F6 100%)',
                        padding: '1.5rem',
                        color: '#fff',
                        position: 'relative',
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={onClose}
                        disabled={stkQueryLoading}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '2rem',
                            height: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            opacity: stkQueryLoading ? 0.4 : 1,
                        }}
                        aria-label="Close"
                    >
                        <FaTimes size={14} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div
                            style={{
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '0.875rem',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FaCreditCard size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                Retry Payment
                            </h3>
                            <p style={{ fontSize: '0.8125rem', opacity: 0.85, margin: '0.2rem 0 0' }}>
                                Booking #{bookingId} • Complete via M-Pesa
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {/* Amount pill */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, rgba(8,166,246,0.08) 0%, rgba(0,32,74,0.06) 100%)',
                            border: '1.5px solid rgba(8,166,246,0.15)',
                            borderRadius: '1rem',
                            padding: '0.875rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                        }}
                    >
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Amount Due</span>
                        <span
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                color: '#08A6F6',
                            }}
                        >
                            KSh {amount.toLocaleString()}
                        </span>
                    </div>

                    {stkQueryLoading ? (
                        <STKPushQueryLoading number={phoneNumber} attempt={attempt} />
                    ) : success ? (
                        <PaymentSuccess
                            title="Payment Successful!"
                            message={rideId
                                ? `Ride #${rideId} is now active. Thank you for your payment of KES ${amount.toLocaleString()}.`
                                : `Booking #${bookingId} is now confirmed. Thank you for your payment of KES ${amount.toLocaleString()}.`}
                            viewLink={rideId ? "/dashboard/driver/myrides" : "/dashboard/passenger/bookings"}
                            viewLabel={rideId ? "View My Rides" : "View My Bookings"}
                            onView={() => {
                                if (onSuccess) onSuccess();
                                onClose();
                            }}
                        />
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: '#374151',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    M-Pesa Phone Number
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: '0 auto 0 0',
                                            paddingLeft: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#9ca3af',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <FaPhone style={{ fontSize: '0.875rem' }} />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="e.g. 0712345678"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            paddingLeft: '2.5rem',
                                            paddingRight: '1rem',
                                            paddingTop: '0.75rem',
                                            paddingBottom: '0.75rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '0.875rem',
                                            outline: 'none',
                                            fontSize: '0.9375rem',
                                            color: '#111827',
                                            transition: 'border-color 0.2s',
                                            boxSizing: 'border-box',
                                        }}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = '#08A6F6')}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                                    />
                                </div>
                                <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                    You will receive an STK push prompt on this number.
                                </p>
                            </div>

                            {errorMessage && (
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        fontSize: '0.875rem',
                                        borderRadius: '0.875rem',
                                        border: '1px solid #fecaca',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.625rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '0.375rem',
                                            height: '0.375rem',
                                            borderRadius: '50%',
                                            background: '#ef4444',
                                            marginTop: '0.375rem',
                                            flexShrink: 0,
                                        }}
                                    />
                                    {errorMessage}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        background: '#f3f4f6',
                                        color: '#4b5563',
                                        fontWeight: 600,
                                        borderRadius: '0.875rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        opacity: loading ? 0.5 : 1,
                                    }}
                                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#e5e7eb')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: '0.875rem',
                                        background: loading
                                            ? '#9ca3af'
                                            : 'linear-gradient(135deg, #08A6F6 0%, #00204a 100%)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        borderRadius: '0.875rem',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        boxShadow: loading ? 'none' : '0 4px 15px rgba(8,166,246,0.35)',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9375rem',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {loading ? (
                                        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        `Pay KSh ${amount.toLocaleString()}`
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default RetryPaymentModal;
