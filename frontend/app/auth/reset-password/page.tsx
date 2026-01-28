'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import Navbar from '@/app/components/Navbar';
import Image from 'next/image';
import { Lock, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const [formData, setFormData] = useState({
        email: emailParam,
        otp: '',
        new_password: '',
        confirm_password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { resetPassword } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword({
                email: formData.email,
                otp: formData.otp,
                new_password: formData.new_password,
            });

            toast.success('Password reset successfully!');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-3">
                    <Image
                        src="/logo.png"
                        alt="Travas Logo"
                        width={60}
                        height={60}
                    />
                </div>
                <h1 className="text-3xl font-bold text-[#00204a]">Reset Password</h1>
                <p className="text-sm text-gray mt-2">
                    Enter the reset code sent to your email and set a new password
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#013C5E] mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none bg-gray-50"
                        placeholder="you@example.com"
                        required
                        readOnly
                    />
                </div>

                <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-[#013C5E] mb-1">
                        Reset Code (OTP)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="otp"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                            placeholder="123456"
                            required
                        />
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                </div>

                <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-[#00204a] mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="new_password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            className="w-full pl-10 pr-10 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#08A6F6] focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-[#00204a] mb-1">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirm_password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className="w-full pl-10 pr-10 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-4 rounded-lg bg-[#08A6F6] text-white font-semibold text-lg shadow-md hover:bg-[#00204a] transition-all disabled:opacity-50"
                >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPassword() {
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
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
