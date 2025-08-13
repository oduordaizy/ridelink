'use client'

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Image from "next/image";
import Link from "next/link";
import testimonials from "./data/testimonials";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {
   useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col items-center py-12 px-4 w-full">
        {/* Hero Section */}
        <section className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Effortless <span className="text-primary">Ridesharing</span> for Everyone
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Connect drivers with empty seats to passengers seeking affordable, convenient rides. Post, search, and book trips in real time—securely and easily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link 
                href="/dashboard/passenger" 
                className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
              >
                Find Ride
              </Link>
              <Link 
                href="/dashboard/driver" 
                className="px-8 py-4 rounded-lg border-2 border-primary text-primary font-bold text-lg hover:bg-primary/10 transition-colors"
              >
                Post Ride
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <Image 
                src="/main-img.png" 
                alt="People carpooling together" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-10">Why Choose Travas?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              <h3 className="text-xl font-semibold text-primary mb-2">Easy & Fast</h3>
              <p className="text-gray">Post or find rides in seconds. Our intuitive platform makes shared travel simple for everyone.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <h3 className="text-xl font-semibold text-primary mb-2">Real-Time Booking</h3>
              <p className="text-gray">See available seats and book instantly. No waiting, no hassle—just seamless travel.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" /></svg>
              <h3 className="text-xl font-semibold text-primary mb-2">Secure & Transparent</h3>
              <p className="text-gray">Payments, wallet, and contact info are all handled securely. Your trust and safety are our priority.</p>
            </div>
          </div>
        </section>

        
        {/* Testimonials */}
        <section className="px-4 sm:px-6 py-16">
      <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-10 text-primary">
        What Our Customers Say
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6"
            data-aos="fade-up"
            data-aos-delay={index * 200}
          >
            <p className="italic mb-4">&quot;{testimonial.feedback}&quot;</p>
            <p className="text-right font-semibold">{testimonial.name}</p>
          </div>
        ))}
      </div>
    </section>

        {/* CTA Section */}
        <section className="w-full max-w-3xl text-center mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who save money and reduce their carbon footprint with Travas.
          </p>
          <Link 
            href="/auth/register" 
            className="inline-block px-8 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
          >
            Sign Up Now
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
