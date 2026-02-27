import { FaCheckCircle } from "react-icons/fa";
import Link from "next/link";

interface SuccessProps {
    title?: string;
    message?: string;
    viewLink?: string;
    viewLabel?: string;
    continueLabel?: string;
    onContinue?: () => void;
}

export default function PaymentSuccess({
    title = "Payment Successful",
    message = "Your payment has been processed successfully. Thank you for using RideLink.",
    viewLink = "/dashboard/passenger/bookings",
    viewLabel = "View Bookings",
    continueLabel = "Continue",
    onContinue
}: SuccessProps) {
    return (
        <div className="space-y-6 text-center text-black p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md mx-auto">
            <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                    <FaCheckCircle className="text-green-500 text-6xl" />
                </div>
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 leading-relaxed">{message}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {onContinue && (
                    <button
                        onClick={onContinue}
                        className="flex-1 px-6 py-4 bg-gray-100 text-gray-800 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                        {continueLabel}
                    </button>
                )}
                <Link href={viewLink} className="flex-1">
                    <button className="w-full px-6 py-4 bg-[#08A6F6] text-white rounded-2xl font-bold hover:bg-[#00204a] shadow-lg transition-all">
                        {viewLabel}
                    </button>
                </Link>
            </div>
        </div>
    );
}
