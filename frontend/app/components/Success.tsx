import { FaCheckCircle } from "react-icons/fa";

export default function PaymentSuccess() {
    return (
        <div className="space-y-4 text-center text-black p-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-center">
                <FaCheckCircle className="text-green-500 text-6xl" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-800">Payment Successful</h1>
                <p className="text-gray-600">Your payment has been processed successfully. Thank you for using RideLink.</p>
            </div>
            <div className="pt-4">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
                >
                    View Bookings
                </button>
            </div>
        </div>
    );
}
