'use client'                                  
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function HowItWorks() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center py-12 px-4">
      {/* Hero Section */}
      <section className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-800 mb-4">How RideLink Works</h1>
        <p className="text-lg md:text-xl text-indigo-600 mb-6">
          RideLink makes shared travel simple, secure, and rewarding for both drivers and passengers. Here’s how you can get started:
        </p>
      </section>

      {/* Steps for Drivers & Passengers */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* For Drivers */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">For Drivers</h2>
          <ol className="list-decimal list-inside text-indigo-700 space-y-4 text-left">
            <li>
              <span className="font-semibold text-blue-600">Sign Up:</span> Create your free RideLink account and set up your digital wallet.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Post a Ride:</span> Enter your trip details—origin, destination, departure time, and available seats. Pay a small platform fee from your wallet to post.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Get Booked:</span> Passengers discover your ride and book seats in real time. You earn directly to your wallet.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Connect & Go:</span> After payment, passengers get your contact info. Enjoy the journey together!
            </li>
          </ol>
        </div>
        {/* For Passengers */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">For Passengers</h2>
          <ol className="list-decimal list-inside text-indigo-700 space-y-4 text-left">
            <li>
              <span className="font-semibold text-blue-600">Sign Up:</span> Create your free account and top up your wallet securely.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Find a Ride:</span> Search for available rides by location, date, and time. View trip details and seat availability instantly.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Book & Pay:</span> Reserve your seat and pay securely through the app. Your payment is safe and transparent.
            </li>
            <li>
              <span className="font-semibold text-blue-600">Contact & Travel:</span> Get the driver’s contact info after payment. Meet up and enjoy your ride!
            </li>
          </ol>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-2xl w-full text-center mt-8">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">Ready to Get Started?</h2>
        <p className="text-indigo-700 mb-6">Join RideLink today and experience a smarter, friendlier way to travel—whether you’re behind the wheel or along for the ride.</p>
        <a href="#" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Sign Up Now</a>
      </section>
    </main>
      <Footer />
    </>
  )
}