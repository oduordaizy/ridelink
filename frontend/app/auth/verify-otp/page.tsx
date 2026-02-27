'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import { toast } from 'react-toastify';

function VerifyOTPContent() {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { verifyOtp, sendOtp } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Email not found. Please register again.');
            return;
        }
        setIsLoading(true);
        try {
            const user = await verifyOtp(email, otp);
            toast.success('Email verified successfully!');
            if (user.user_type === 'driver') {
                router.push('/dashboard/driver');
            } else {
                router.push('/dashboard/passenger');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) return;
        try {
            await sendOtp(email);
            toast.success('OTP sent successfully!');
        } catch (error) {
            toast.error('Failed to resend OTP');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-12 px-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                <Image src="/logo1.png" alt="iTravas Logo" width={60} height={60} className="mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-[#013C5E] mb-2">Verify Your Email</h1>
                <p className="text-gray-600 mb-6">Enter the code sent to {email}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                        placeholder="000000"
                        maxLength={6}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-lg bg-[#08A6F6] text-white font-semibold shadow-md hover:bg-[#013C5E] transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <button
                    onClick={handleResendOtp}
                    className="mt-4 text-[#08A6F6] hover:underline text-sm font-medium"
                >
                    Resend Code
                </button>
            </div>
        </main>
    );
}

export default function VerifyOTP() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyOTPContent />
            </Suspense>
            <Footer />
        </>
    )
}
