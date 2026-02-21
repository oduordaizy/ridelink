'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import Link from 'next/link';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col items-center py-12 px-4 text-gray-700">
        <section className="max-w-3xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#00204a] mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl text-gray-500 mb-6 font-medium">
            Have questions, feedback, or need help? Reach out to the iTravas team—we&apos;re here to help you on your journey.
          </p>
        </section>

        <section className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-[#00204a] mb-1 uppercase tracking-tight">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#08A6F6]/50 focus:outline-none bg-white font-medium"
                placeholder="Your Name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[#00204a] mb-1 uppercase tracking-tight">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#08A6F6]/50 focus:outline-none bg-white font-medium"
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-bold text-[#00204a] mb-1 uppercase tracking-tight">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#08A6F6]/50 focus:outline-none bg-white font-medium"
                placeholder="How can we help you?"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-8 py-3 rounded-lg bg-[#08A6F6] text-white font-bold text-lg shadow-md hover:bg-[#00204a] transition-all transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400">
            <p className="font-medium">Or email us at <a href="mailto:contact@itravas.com" className="text-[#08A6F6] hover:underline font-bold">contact@itravas.com</a></p>
            <p className="mt-2 font-semibold">Nairobi, Kenya</p>
          </div>
        </section>

        <section className="max-w-2xl w-full text-center mt-8 px-4">
          <h2 className="text-2xl font-bold text-[#00204a] mb-4">We&apos;re here for you</h2>
          <p className="text-gray-500 mb-6 font-medium leading-relaxed">
            Our team responds quickly to all inquiries. Thank you for helping us make iTravas better for everyone!
          </p>
          <Link
            href="/how-it-works"
            className="inline-block px-6 py-3 rounded-lg text-[#08A6F6] hover:bg-blue-50 transition-all font-bold group"
          >
            Learn how iTravas works <span className="group-hover:ml-1 transition-all">→</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;