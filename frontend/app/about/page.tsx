import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Us | iTravas",
  description: "Learn more about iTravas, our mission to make shared travel effortless, affordable, and sustainable across Kenya.",
  alternates: {
    canonical: "/about",
  },
};

const values = [
  {
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.306.835 2.417 2 2.83V17h2v-3.17c1.165-.413 2-1.524 2-2.83z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 11c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.306.835 2.417 2 2.83V17h2v-3.17c1.165-.413 2-1.524 2-2.83z" />
      </svg>
    ),
    title: 'Trust & Safety',
    desc: 'Secure payments and verified profiles for peace of mind.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v4h-1m-4 0h-1v-4H7m4-4h.01M12 20h.01M4 4h16v16H4V4z" />
      </svg>
    ),
    title: 'Transparency',
    desc: 'Clear pricing, wallet tracking, and open communication.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 11a4 4 0 10-8 0 4 4 0 008 0zm6 8v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Community',
    desc: 'Building connections between drivers and passengers.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    title: 'Sustainability',
    desc: 'Fewer cars, less congestion, a greener planet.'
  },
];

export default function About() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative flex flex-col items-center justify-center text-center py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
              <path fill="var(--primary)" fillOpacity="0.08" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary mb-6 relative z-10">
            About iTravas
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">
            iTravas is on a mission to make shared travel effortless, affordable, and sustainable. We connect drivers with empty seats to passengers seeking convenient rides, making every journey more social and eco-friendly.
          </p>
          <div className="flex justify-center relative z-10">
            <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="110" cy="60" rx="100" ry="50" fill="var(--primary)" fillOpacity="0.12" />
              <rect x="60" y="50" width="100" height="40" rx="18" fill="var(--primary)" />
              <circle cx="85" cy="90" r="10" fill="var(--primary)" />
              <circle cx="135" cy="90" r="10" fill="var(--primary)" />
              <rect x="90" y="60" width="40" height="10" rx="4" fill="var(--primary-foreground)" />
            </svg>
          </div>
        </section>

        {/* Vision/Story Section */}
        <section className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 bg-card rounded-3xl shadow-2xl p-10 md:p-16 mb-16 mt-4">
          <div className="flex-1 flex flex-col items-start">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Vision</h2>
            <p className="text-lg text-muted-foreground mb-6">We envision a world where every car trip is optimized for community and the environment. By making it easy to share rides, we help reduce traffic, lower costs, and cut carbon emissions—one trip at a time.</p>
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Story</h2>
            <p className="text-lg text-muted-foreground">Founded by passionate travelers and tech enthusiasts, Travas was born from the desire to make travel more social, affordable, and sustainable. We believe every journey is an opportunity to connect and make a difference.</p>
          </div>
          <div className="flex-1 flex justify-center">
            <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="120" cy="90" rx="110" ry="80" fill="var(--primary)" fillOpacity="0.10" />
              <rect x="70" y="80" width="100" height="50" rx="20" fill="var(--primary)" />
              <circle cx="100" cy="130" r="13" fill="var(--primary)" />
              <circle cx="140" cy="130" r="13" fill="var(--primary)" />
              <rect x="105" y="90" width="30" height="12" rx="5" fill="var(--primary-foreground)" />
            </svg>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="w-full max-w-5xl mb-16 px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                <div className="mb-4 p-3 bg-primary/10 rounded-full">{v.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community CTA Section */}
        <section className="w-full max-w-2xl text-center mb-20 px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4">Join the iTravas Community</h2>
          <p className="text-muted-foreground mb-6">
            Whether you&apos;re a driver or a passenger, iTravas is here to make your journey better. Sign up today and be part of a smarter, friendlier way to travel.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/90 transition-all"
          >
            Get Started
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}