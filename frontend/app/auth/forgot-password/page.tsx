'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import Navbar from '@/app/components/Navbar';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { forgotPassword } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setIsSent(true);
            toast.success('Reset code sent to your email');
            setTimeout(() => {
                router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <main
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#08A6F6]/10 via-[#08A6F6]/5 to-white py-12 px-6"
                style={{
                    backgroundImage: "url('/bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-3">
                            <Image
                                src="/logo1.png"
                                alt="iTravas Logo"
                                width={60}
                                height={60}
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-[#00204a]">Forgot Password?</h1>
                        <p className="text-sm text-gray mt-2">
                            Enter your email and we'll send you a reset code
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#013C5E] mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading || isSent}
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSent}
                            className="w-full py-3 rounded-lg bg-[#08A6F6] text-white font-semibold text-lg shadow-md hover:bg-[#00204a] transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Sending Code...' : isSent ? 'Code Sent!' : 'Send Reset Code'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center text-sm font-semibold text-[#08A6F6] hover:text-[#00204a] transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
