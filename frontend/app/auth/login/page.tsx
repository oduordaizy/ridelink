import Footer from "@/app/components/Footer"
import Navbar from "@/app/components/Navbar"


export default function Login() {
  return (
    <>
    <Navbar />

    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-white flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-indigo-800 mb-6 text-center">Sign In to RideLink</h1>
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">Email</label>
            <input type="email" id="email" name="email" className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" placeholder="you@email.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-indigo-700 mb-1">Password</label>
            <input type="password" id="password" name="password" className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none" placeholder="Password" />
          </div>
          <button type="submit" className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all">Login</button>
        </form>
        <p className="mt-6 text-center text-indigo-700 text-sm">
          Don&apos;t have an account?{' '}
          <a href="/register" className="underline hover:text-blue-600">Register</a>
        </p>
      </div>
    </main>
    <Footer />
    </>
  );
} 