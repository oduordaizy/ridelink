import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center py-12 px-4 w-full">
        {/* Hero Section */}
        <section className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-800 mb-6 leading-tight">
              Effortless <span className="text-blue-500">Ridesharing</span> for Everyone
            </h1>
            <p className="text-lg md:text-xl text-indigo-600 mb-8">
              Connect drivers with empty seats to passengers seeking affordable, convenient rides. Post, search, and book trips in real time—securely and easily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition">Find a Ride</button>
              <button className="px-6 py-3 rounded-lg bg-white text-blue-700 border border-blue-600 font-bold text-lg shadow hover:bg-blue-50 transition">Post a Ride</button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            {/* Placeholder SVG illustration */}
            <svg width="320" height="240" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="320" height="240" rx="32" fill="#6366F1" fillOpacity="0.1"/>
              <ellipse cx="160" cy="180" rx="120" ry="32" fill="#6366F1" fillOpacity="0.15"/>
              <rect x="80" y="100" width="160" height="60" rx="20" fill="#6366F1"/>
              <circle cx="110" cy="170" r="18" fill="#2563EB"/>
              <circle cx="210" cy="170" r="18" fill="#2563EB"/>
              <rect x="120" y="110" width="80" height="20" rx="8" fill="#fff"/>
              <rect x="140" y="135" width="40" height="10" rx="5" fill="#fff"/>
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 text-center mb-10">Why Choose RideLink?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Easy & Fast</h3>
              <p className="text-indigo-600">Post or find rides in seconds. Our intuitive platform makes shared travel simple for everyone.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Real-Time Booking</h3>
              <p className="text-indigo-600">See available seats and book instantly. No waiting, no hassle—just seamless travel.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Secure & Transparent</h3>
              <p className="text-indigo-600">Payments, wallet, and contact info are all handled securely. Your trust and safety are our priority.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-5xl mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 text-center mb-10">How It Works</h2>
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

        {/* Call to Action Section */}
        <section className="w-full max-w-3xl text-center mt-8 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-4">Ready to Ride?</h2>
          <p className="text-indigo-700 mb-6">Join RideLink today and experience a smarter, friendlier way to travel. Whether you’re a driver or a passenger, we’re here to make your journey better.</p>
          <a href="#" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Get Started</a>
        </section>
      </main>
      <Footer />
    </>
  );
}
