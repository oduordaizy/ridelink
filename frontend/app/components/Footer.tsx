import React from 'react'
import Image from 'next/image'


export default function Footer() {
  return (
    <footer className="bg-[#00204a] border-t border-gray-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Section 1: Branding */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-0.5">
              <Image
                src="/footer-logo.png"
                alt="iTravas Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <div className="text-white font-bold text-xl">
                iTravas
              </div>
            </div>
            <p className="text-gray-300 text-xs max-w-[250px] leading-relaxed">
              Connecting drivers and passengers for affordable, secure, and convenient rides across Kenya.
            </p>
          </div>

          {/* Section 2: Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold">Quick Links</h3>
            <ul className="flex flex-col space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Home</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">About Us</a></li>
              <li><a href="/how-it-works" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">How It Works</a></li>
              <li><a href="/auth/register" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Sign Up</a></li>
              <li><a href="/auth/login" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Log In</a></li>
            </ul>
          </div>

          {/* Section 3: Support */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold">Support</h3>
            <ul className="flex flex-col space-y-2">
              <li><a href="/contact" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Contact Form</a></li>
              <li><a href="mailto:contact@itravas.com" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">contact@itravas.com</a></li>
              <li><a href="tel:+254140551456" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">+254 140 551 456</a></li>
            </ul>
          </div>

          {/* Section 4: Legal */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold">Legal</h3>
            <ul className="flex flex-col space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="/" className="text-gray-300 hover:text-[#08A6F6] transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-400 text-sm">
            &copy; 2026 iTravas. All rights reserved.
          </div>

          {/* Social Icons */}
          <div className="flex space-x-6">

            <a href="https://facebook.com/itravas" aria-label="Facebook" className="text-gray-400 hover:text-[#08A6F6] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24h11.495v-9.294H9.692v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
              </svg>
            </a>

            <a href="https://tiktok.com/@itravas" aria-label="TikTok" className="text-gray-400 hover:text-[#08A6F6] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.38 6.38 0 0 1-1.06-.77v7.53c.01 2.03-.43 4.06-1.66 5.69-1.36 1.81-3.59 2.91-5.84 2.87-1.03-.02-2.03-.27-2.97-.68-1.18-.5-2.22-1.3-3.03-2.31-1.09-1.36-1.61-3.08-1.5-4.8.06-1.75.61-3.51 1.74-4.88 1.12-1.35 2.78-2.29 4.52-2.53.42-.06.84-.09 1.25-.09 1.34.02 2.39.3 3.42.92.01-1.31.02-2.61.02-3.92-.85-.18-1.62-.57-2.23-1.18-.74-.74-1.14-1.74-1.17-2.79 1.31.02 2.61.01 3.91.02.08 1.53.63 3.09 1.75 4.17.11.11.22.21.34.31v-12.22z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
