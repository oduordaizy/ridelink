'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import Navbar from '@/app/components/Navbar';
import Image from 'next/image';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex bg-white text-[#013C5E]">
        {/* Left side image */}
        <div className="hidden md:flex w-1/2 relative">
          <Image
            src="/login-image.png"
            alt="Travas carpool illustration"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0  flex items-center justify-center">
            {/* <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg text-center px-8 leading-tight">
              Ride Together.<br /> Save More. 🌍
            </h2> */}
          </div>
        </div>

        {/* Right side form */}
        <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-12 bg-[#F8FAFC]">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-[#08A6F6]/20">
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/logo.png"
                alt="Travas Logo"
                width={60}
                height={60}
                className="mb-3"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-[#013C5E] text-center">
                Welcome to Travas
              </h1>
              <p className="text-[#08A6F6] mt-2 text-sm">
                Log in to start your journey 🚗
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#013C5E] mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#08A6F6]/40 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#013C5E] mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#08A6F6]/40 rounded-lg focus:ring-2 focus:ring-[#08A6F6] focus:outline-none"
                  placeholder="Password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 rounded-lg bg-[#08A6F6] text-white font-semibold text-lg shadow-md hover:bg-[#013C5E] transition-all disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#013C5E]">
              Don&apos;t have an account?{' '}
              <a
                href="/auth/register"
                className="font-semibold text-[#08A6F6] hover:underline"
              >
                Register
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
