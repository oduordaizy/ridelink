import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us | Travas",
  description: "Get in touch with the Travas team. We're here to help with your questions, feedback, or support needs.",
  alternates: {
    canonical: "/contact",
  },
};

const Contact = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
        <section className="max-w-3xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            Have questions, feedback, or need help? Reach out to the Travas team—we&apos;re here to help you on your journey.
          </p>
        </section>

        <section className="max-w-2xl w-full bg-card rounded-2xl shadow-lg p-8 mb-12">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-background"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-background"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-background"
                placeholder="How can we help you?"
              />
            </div>
            <button
              type="submit"
              className="w-full px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow hover:bg-primary/90 transition-all"
            >
              Send Message
            </button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            <p>Or email us at <a href="mailto:support@travas.com" className="text-primary hover:underline">support@travas.com</a></p>
            <p className="mt-2">Nairobi, Kenya</p>
          </div>
        </section>

        <section className="max-w-2xl w-full text-center mt-8 px-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">We&apos;re here for you</h2>
          <p className="text-muted-foreground mb-6">
            Our team responds quickly to all inquiries. Thank you for helping us make Travas better for everyone!
          </p>
          <Link
            href="/how-it-works"
            className="inline-block px-6 py-3 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            Learn how Travas works →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;