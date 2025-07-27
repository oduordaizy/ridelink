'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";

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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
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

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      router.push('/'); // Redirect to home page after registration
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-6 text-center">Create Your Account</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-indigo-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  id="first_name" 
                  name="first_name" 
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                  placeholder="First Name" 
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-indigo-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  id="last_name" 
                  name="last_name" 
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                  placeholder="Last Name" 
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-indigo-700 mb-1">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="Choose a username" 
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="you@email.com" 
                required
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-indigo-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                id="phone_number" 
                name="phone_number" 
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="+1234567890" 
                required
              />
            </div>

            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-indigo-700 mb-1">I am a</label>
              <select 
                id="user_type" 
                name="user_type" 
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                required
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
              </select>
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

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-indigo-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                id="password_confirm" 
                name="password_confirm" 
                value={formData.password_confirm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" 
                placeholder="Confirm Password" 
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-indigo-700 text-sm">
            Already have an account?{' '}
            <a href="/auth/login" className="underline hover:text-blue-600">Sign In</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
} 