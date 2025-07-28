export default function Contact() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center py-12 px-4">
      <section className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-800 mb-4">Contact Us</h1>
        <p className="text-lg md:text-xl text-indigo-600 mb-6">
          Have questions, feedback, or need help? Reach out to the Travas team—we’re here to help you on your journey.
        </p>
      </section>
      <section className="max-w-2xl w-full bg-white/80 rounded-2xl shadow-lg p-8 mb-12">
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-indigo-700 mb-1">Name</label>
            <input type="text" id="name" name="name" className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" placeholder="Your Name" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">Email</label>
            <input type="email" id="email" name="email" className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" placeholder="you@email.com" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-indigo-700 mb-1">Message</label>
            <textarea id="message" name="message" rows={5} className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" placeholder="How can we help you?" />
          </div>
          <button type="submit" className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Send Message</button>
        </form>
        <div className="mt-8 text-center text-indigo-700">
          <p>Or email us at <a href="mailto:support@travas.com" className="underline hover:text-blue-600">support@travas.com</a></p>
          <p className="mt-2">Travas HQ, 123 Shared Road, Mobility City</p>
        </div>
      </section>
      <section className="max-w-2xl w-full text-center mt-8">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">We’re here for you</h2>
        <p className="text-indigo-700 mb-6">Our team responds quickly to all inquiries. Thank you for helping us make Travas better for everyone!</p>
      </section>
    </main>
  );
} 