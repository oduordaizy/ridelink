'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import Navbar from '@/app/components/Navbar';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'passenger' as 'driver' | 'passenger',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'registering' | 'sending_otp' | 'success'>('idle');
  const { register, sendOtp } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setStatus('registering');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      setStatus('idle');
      return;
    }

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        user_type: formData.user_type,
      });

      // Send OTP
      setStatus('sending_otp');
      await sendOtp(formData.email);

      setStatus('success');
      toast.success('OTP sent to your email');

      // Short delay to let user see the success message before redirect
      setTimeout(() => {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }, 1000);

    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        const message = error.message;
        // If message looks like a JSON object (field errors)
        if (message.includes('{') || message.includes(':')) {
          setError('Please check the form for errors');
          toast.error(message);
        } else {
          setError(message);
          toast.error(message);
        }
      } else {
        setError('Registration failed. Please try again.');
        toast.error('Registration failed');
      }
      setStatus('idle');
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
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Image
                src="/logo.png"
                alt="Travas Logo"
                width={60}
                height={60}
              />
            </div>
            <h1 className="text-3xl font-bold text-[#00204a]">Create Your Account</h1>
            <p className="text-sm text-gray mt-2">
              start your journey today
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-[#013C5E] mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-[#013C5E] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#013C5E] mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                placeholder="Username"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#013C5E] mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-[#013C5E] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                placeholder="+254712345678"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#00204a] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#08A6F6] focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="password_confirm" className="block text-sm font-medium text-[#00204a] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#08A6F6] focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-[#00204a] mb-1">
                I am a
              </label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#08A6F6]/30 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-[#08A6F6] text-white font-semibold text-lg shadow-md hover:bg-[#00204a] transition-all disabled:opacity-50"
            >
              {status === 'registering'
                ? 'Creating Account...'
                : status === 'sending_otp'
                  ? 'Sending OTP...'
                  : status === 'success'
                    ? 'Redirecting...'
                    : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#00204a]">
            Already have an account?{' '}
            <a
              href="/auth/login"
              className="font-semibold text-[#08A6F6] hover:text-[#00204a]"
            >
              Sign In
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
