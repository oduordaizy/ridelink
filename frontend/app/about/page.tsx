import React from 'react'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center py-12 px-4">
      
      <section className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-800 mb-4">About RideLink</h1>
        <p className="text-lg md:text-xl text-indigo-600 mb-6">
          RideLink is on a mission to make shared travel effortless, affordable, and sustainable. We connect drivers with empty seats to passengers seeking convenient rides, making every journey more social and eco-friendly.
        </p>
      </section>
      <section className="max-w-4xl w-full bg-white/80 rounded-2xl shadow-lg p-8 mb-12 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Our Vision</h2>
          <p className="text-indigo-700 mb-4">
            We envision a world where every car trip is optimized for community and the environment. By making it easy to share rides, we help reduce traffic, lower costs, and cut carbon emissions—one trip at a time.
          </p>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Our Values</h2>
          <ul className="list-disc list-inside text-indigo-700 space-y-1">
            <li>Trust &amp; Safety: Secure payments and verified profiles for peace of mind.</li>
            <li>Transparency: Clear pricing, wallet tracking, and open communication.</li>
            <li>Community: Building connections between drivers and passengers.</li>
            <li>Sustainability: Fewer cars, less congestion, a greener planet.</li>
          </ul>
        </div>
        <div className="flex-1 flex justify-center">
          {/* Placeholder illustration */}
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="#6366F1" fillOpacity="0.1"/>
            <rect x="40" y="80" width="120" height="60" rx="20" fill="#6366F1"/>
            <circle cx="70" cy="140" r="14" fill="#2563EB"/>
            <circle cx="130" cy="140" r="14" fill="#2563EB"/>
            <rect x="80" y="90" width="40" height="15" rx="6" fill="#fff"/>
          </svg>
        </div>
      </section>
      <section className="max-w-2xl w-full text-center mt-8">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">Join the RideLink Community</h2>
        <p className="text-indigo-700 mb-6">Whether you&apos;re a driver or a passenger, RideLink is here to make your journey better. Sign up today and be part of a smarter, friendlier way to travel.</p>
        <a href="#" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Get Started</a>
      </section>
    </main>
      <Footer />
    </>
  );
} 