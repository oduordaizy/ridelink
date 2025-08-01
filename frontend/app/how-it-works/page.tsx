'use client'
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';


export default function HowItWorks() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center justify-center text-center py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full"><path fill="#6366F1" fillOpacity="0.08" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path></svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-700 mb-6 relative z-10 drop-shadow-lg">How Travas Works</h1>
          <p className="text-xl md:text-2xl text-indigo-700 mb-8 max-w-2xl mx-auto relative z-10">Travas makes shared travel simple, secure, and rewarding for both drivers and passengers. Here’s how you can get started:</p>
          <div className="flex justify-center relative z-10 mb-2">
            <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="110" cy="60" rx="100" ry="50" fill="#6366F1" fillOpacity="0.12" />
              <rect x="60" y="50" width="100" height="40" rx="18" fill="#6366F1" />
              <circle cx="85" cy="90" r="10" fill="#2563EB" />
              <circle cx="135" cy="90" r="10" fill="#2563EB" />
              <rect x="90" y="60" width="40" height="10" rx="4" fill="#fff" />
            </svg>
          </div>
        </section>

        {/* Steps Section */}
        <section className="w-full max-w-5xl mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Sign Up</h3>
              <p className="text-indigo-600">Create your free account as a driver or passenger in seconds.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Post or Find a Ride</h3>
              <p className="text-indigo-600">Drivers post trip details. Passengers search and book available seats in real time.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Travel & Connect</h3>
              <p className="text-indigo-600">Enjoy your journey, connect with others, and track your wallet and bookings easily.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="max-w-2xl w-full text-center mb-20">
          <h2 className="text-3xl font-bold text-[#00204a] mb-4">Ready to Get Started?</h2>
          <p className="text-indigo-700 mb-6">Join Travas today and experience a smarter, friendlier way to travel—whether you’re behind the wheel or along for the ride.</p>
          <a href="#" className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">Sign Up Now</a>
        </section>
      </main>
      <Footer />
    </>
  );
}