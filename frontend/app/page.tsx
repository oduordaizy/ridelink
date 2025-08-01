import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Image from "next/image";
import Link from "next/link";
// import testimonials from "./data/testimonials";
// import { motion } from 'framer-motion';



export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#d9faff] flex flex-col items-center py-12 px-4 w-full">
        {/* Hero Section */}
        <section className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-800 mb-6 leading-tight">
              Effortless <span className="text-blue-500">Ridesharing</span> for Everyone
            </h1>
            <p className="text-lg md:text-xl text-blue-700 mb-8">
              Connect drivers with empty seats to passengers seeking affordable, convenient rides. Post, search, and book trips in real time—securely and easily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href='/auth/login'><button className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition">Find a Ride</button></Link>
              <Link href='/auth/login'><button className="px-6 py-3 rounded-lg bg-white text-blue-700 border border-blue-600 font-bold text-lg shadow hover:bg-blue-50 transition">Post a Ride</button></Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <Image src='/main-img.png' alt="Main Image" width={500} height={500}/>
            
          </div>
        </section>

       
        {/* Features Section */}
        <section className="w-full max-w-5xl mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 text-center mb-10">Why Choose Travas?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Easy & Fast</h3>
              <p className="text-gray">Post or find rides in seconds. Our intuitive platform makes shared travel simple for everyone.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Real-Time Booking</h3>
              <p className="text-gray">See available seats and book instantly. No waiting, no hassle—just seamless travel.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <svg className="w-12 h-12 mb-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" /></svg>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Secure & Transparent</h3>
              <p className="text-gray">Payments, wallet, and contact info are all handled securely. Your trust and safety are our priority.</p>
            </div>
          </div>
        </section>

       
         {/* Testimonials
        <section className="px-4 sm:px-6 py-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-10 text-[#1d4d4f]">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <p className="italic mb-4">&quot;{testimonial.feedback}&quot;</p>
                <p className="text-right font-semibold">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </section> */}

        {/* Call to Action Section */}
        <section className="w-full max-w-3xl text-center mt-8 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">Ready to Ride?</h2>
          <p className="text-indigo-700 mb-6">Join Travas today and experience a smarter, friendlier way to travel. Whether you’re a driver or a passenger, we’re here to make your journey better.</p>
          <a href="/auth/login" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Get Started</a>
        </section>
      </main>
      <Footer />
    </>
  );
}
