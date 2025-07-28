'use client'
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const driverSteps = [
  {
    title: 'Sign Up',
    desc: 'Create your free Travas account and set up your digital wallet.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><path d="M32 36c-6.627 0-12 2.686-12 6v2h24v-2c0-3.314-5.373-6-12-6z" fill="#2563EB"/><circle cx="32" cy="24" r="8" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Post a Ride',
    desc: 'Enter your trip details—origin, destination, time, and seats. Pay a small platform fee to post.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><rect x="8" y="24" width="48" height="24" rx="12" fill="#2563EB" fillOpacity="0.12"/><rect x="16" y="32" width="32" height="8" rx="4" fill="#2563EB"/><circle cx="20" cy="48" r="4" fill="#6366F1"/><circle cx="44" cy="48" r="4" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Get Booked',
    desc: 'Passengers discover your ride and book seats in real time. You earn directly to your wallet.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><rect x="20" y="28" width="24" height="8" rx="4" fill="#2563EB"/><circle cx="32" cy="40" r="4" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Connect & Go',
    desc: 'After payment, passengers get your contact info. Enjoy the journey together!',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><path d="M24 32h16M32 24v16" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/></svg>
    )
  }
];

const passengerSteps = [
  {
    title: 'Sign Up',
    desc: 'Create your free account and top up your wallet securely.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><path d="M32 36c-6.627 0-12 2.686-12 6v2h24v-2c0-3.314-5.373-6-12-6z" fill="#2563EB"/><circle cx="32" cy="24" r="8" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Find a Ride',
    desc: 'Search for available rides by location, date, and time. View trip details and seat availability instantly.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><rect x="8" y="24" width="48" height="24" rx="12" fill="#2563EB" fillOpacity="0.12"/><rect x="16" y="32" width="32" height="8" rx="4" fill="#2563EB"/><circle cx="20" cy="48" r="4" fill="#6366F1"/><circle cx="44" cy="48" r="4" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Book & Pay',
    desc: 'Reserve your seat and pay securely through the app. Your payment is safe and transparent.',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><rect x="20" y="28" width="24" height="8" rx="4" fill="#2563EB"/><circle cx="32" cy="40" r="4" fill="#6366F1"/></svg>
    )
  },
  {
    title: 'Contact & Travel',
    desc: 'Get the driver’s contact info after payment. Meet up and enjoy your ride!',
    img: (
      <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#6366F1" fillOpacity="0.12"/><path d="M24 32h16M32 24v16" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/></svg>
    )
  }
];

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
        <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* For Drivers */}
          <div className="bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-blue-700 mb-8">For Drivers</h2>
            <ol className="space-y-8 w-full">
              {driverSteps.map((step, idx) => (
                <li key={idx} className="flex flex-col items-center text-center group">
                  <div className="mb-2 group-hover:scale-110 transition-transform duration-300">{step.img}</div>
                  <h3 className="text-xl font-semibold text-blue-700 mb-1">{step.title}</h3>
                  <p className="text-indigo-700 text-base">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
          {/* For Passengers */}
          <div className="bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-indigo-700 mb-8">For Passengers</h2>
            <ol className="space-y-8 w-full">
              {passengerSteps.map((step, idx) => (
                <li key={idx} className="flex flex-col items-center text-center group">
                  <div className="mb-2 group-hover:scale-110 transition-transform duration-300">{step.img}</div>
                  <h3 className="text-xl font-semibold text-blue-700 mb-1">{step.title}</h3>
                  <p className="text-indigo-700 text-base">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Call to Action */}
        <section className="max-w-2xl w-full text-center mb-20">
          <h2 className="text-3xl font-bold text-indigo-800 mb-4">Ready to Get Started?</h2>
          <p className="text-indigo-700 mb-6">Join Travas today and experience a smarter, friendlier way to travel—whether you’re behind the wheel or along for the ride.</p>
          <a href="#" className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">Sign Up Now</a>
        </section>
      </main>
      <Footer />
    </>
  );
}