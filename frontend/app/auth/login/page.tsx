'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";

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
      router.push('/dashboard'); // Redirect to dashboard after login
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-6 text-center">Welcome to Travas</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-indigo-700 mb-1">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="Enter your username" 
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-indigo-700 mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="Password" 
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-indigo-700 text-sm">
            Don&apos;t have an account?{' '}
            <a href="/auth/register" className="underline hover:text-blue-600">Register</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
} 