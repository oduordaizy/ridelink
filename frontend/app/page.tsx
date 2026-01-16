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
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-br from-white via-[#C0DFED]/10 to-white flex flex-col items-center py-8 sm:py-12 px-4 w-full overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-[#08A6F6]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-[#00204a]/5 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Section */}
        <section className="relative w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 mb-16 sm:mb-24" data-aos="fade-up">
          <div className="flex-1 text-center md:text-left space-y-6 sm:space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#00204a] leading-[1.1]">
              Effortless <span className="bg-linear-to-br from-[#08A6F6] to-[#003870] bg-clip-text text-transparent">Ridesharing</span> for Everyone
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#003870]/70 leading-relaxed max-w-xl mx-auto md:mx-0">
              Connect drivers with empty seats to passengers seeking affordable, convenient rides. Post, search, and book trips in real time—securely and easily.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start pt-2">
              <Link
                href="/dashboard/passenger"
                className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-linear-to-br from-[#08A6F6] to-[#003870] text-white font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-[#08A6F6]/30 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Find Ride
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
                <div className="absolute inset-0 bg-linear-to-br from-[#003870] to-[#08A6F6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/dashboard/driver"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-[#08A6F6] text-[#08A6F6] font-bold text-base sm:text-lg hover:bg-[#08A6F6] hover:text-white transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
              >
                Post Ride
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-center w-full md:w-auto" data-aos="fade-left" data-aos-delay="300">
            <div className="relative w-full max-w-sm sm:max-w-md aspect-square">
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-[#08A6F6] to-[#003870] rounded-2xl opacity-20 blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 sm:w-32 sm:h-32 bg-linear-to-br from-[#C0DFED] to-[#08A6F6] rounded-full opacity-30 blur-2xl"></div>

              <div>
                <Image
                  src="/main-img.png"
                  alt="People carpooling together"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-6xl mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-16" data-aos="fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#00204a] mb-3 sm:mb-4">
              Why Choose <span className="text-[#08A6F6]">Travas</span>?
            </h2>
            <p className="text-base sm:text-lg text-[#003870]/70 max-w-2xl mx-auto px-4">
              Experience ridesharing reimagined with features designed for your convenience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div
              className="group relative bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col items-center text-center hover:shadow-2xl hover:shadow-[#08A6F6]/10 transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-[#08A6F6]/20"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-2xl bg-linear-to-br from-[#08A6F6] to-[#003870] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#00204a] mb-2 sm:mb-3">Easy & Fast</h3>
              <p className="text-sm sm:text-base text-[#003870]/70 leading-relaxed">Post or find rides in seconds. Our intuitive platform makes shared travel simple for everyone.</p>
              <div className="mt-4 sm:mt-6 h-1 w-0 group-hover:w-full bg-linear-to-br from-[#08A6F6] to-[#003870] rounded-full transition-all duration-500"></div>
            </div>

            <div
              className="group relative bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col items-center text-center hover:shadow-2xl hover:shadow-[#08A6F6]/10 transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-[#08A6F6]/20"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-2xl bg-linear-to-br from-[#08A6F6] to-[#003870] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#00204a] mb-2 sm:mb-3">Real-Time Booking</h3>
              <p className="text-sm sm:text-base text-[#003870]/70 leading-relaxed">See available seats and book instantly. No waiting, no hassle—just seamless travel.</p>
              <div className="mt-4 sm:mt-6 h-1 w-0 group-hover:w-full bg-linear-to-br from-[#08A6F6] to-[#003870] rounded-full transition-all duration-500"></div>
            </div>

            <div
              className="group relative bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col items-center text-center hover:shadow-2xl hover:shadow-[#08A6F6]/10 transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-[#08A6F6]/20 sm:col-span-2 md:col-span-1"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-2xl bg-linear-to-br from-[#08A6F6] to-[#003870] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#00204a] mb-2 sm:mb-3">Secure & Transparent</h3>
              <p className="text-sm sm:text-base text-[#003870]/70 leading-relaxed">Payments, wallet, and contact info are all handled securely. Your trust and safety are our priority.</p>
              <div className="mt-4 sm:mt-6 h-1 w-0 group-hover:w-full bg-linear-to-br from-[#08A6F6] to-[#003870] rounded-full transition-all duration-500"></div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16 mb-16 sm:mb-24">
          <div className="text-center mb-10 sm:mb-12" data-aos="fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#00204a] mb-3 sm:mb-4">
              What Our <span className="text-[#08A6F6]">Customers</span> Say
            </h2>
            <p className="text-base sm:text-lg text-[#003870]/70">Join thousands of happy travelers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group bg-linear-to-br from-white to-[#C0DFED]/10 rounded-2xl shadow-md p-6 sm:p-8 hover:shadow-xl hover:shadow-[#08A6F6]/10 transition-all duration-300 hover:-translate-y-1 border border-[#C0DFED]/30"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-[#08A6F6] fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm sm:text-base text-[#003870]/80 italic mb-6 leading-relaxed">
                  &quot;{testimonial.feedback}&quot;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-[#C0DFED]/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-[#08A6F6] to-[#003870] flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#00204a] text-sm sm:text-base">{testimonial.name}</p>
                    <p className="text-xs sm:text-sm text-[#003870]/60">Verified User</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full max-w-4xl text-center mb-16 sm:mb-24 px-4" data-aos="zoom-in">
          <div className="relative bg-linear-to-br from-[#08A6F6] via-[#003870] to-[#00204a] rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of users who save money and reduce their carbon footprint with Travas.
              </p>
              <Link
                href="/auth/register"
                className="inline-block px-8 sm:px-10 py-4 sm:py-5 rounded-xl bg-white text-[#08A6F6] font-bold text-base sm:text-lg hover:bg-[#C0DFED] hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                Sign Up Now - It's Free
              </Link>
              <p className="text-white/80 text-xs sm:text-sm mt-4 sm:mt-6">No credit card required • Start saving today</p>
            </div>
          </div>
        </section>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Travas",
              url: "https://travas.co.ke",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://travas.co.ke/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Travas",
              url: "https://travas.co.ke",
              logo: "https://travas.co.ke/logo.png",
              sameAs: [
                "https://facebook.com/travas",
                "https://twitter.com/travas_ke",
                "https://instagram.com/travas_ke",
              ],
            }),
          }}
        />
      </main>
      <Footer />
    </>
  );
}