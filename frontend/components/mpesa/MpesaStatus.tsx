import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function STKPushQueryLoading({ number, attempt }: { number: string; attempt?: number }) {
    return (
        <div className="space-y-4 text-center p-10 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl">
            <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 animate-pulse uppercase tracking-tight">Processing Payment...</h2>
                <p className="text-gray-600">STK push sent to <span className="font-semibold text-blue-600">{number}</span></p>
                <p className="text-sm font-medium text-gray-500">Please enter your M-Pesa PIN on your phone to confirm.</p>
                {attempt && attempt > 1 && (
                    <p className="text-xs text-gray-400">Checking status... (attempt {attempt})</p>
                )}
            </div>
        </div>
    );
}

interface PaymentSuccessProps {
    title?: string;
    message?: string;
    viewLink?: string;
    viewLabel?: string;
    continueLabel?: string;
    onContinue?: () => void;
}

export function PaymentSuccess({
    title = "Payment Successful!",
    message = "Your wallet has been topped up successfully.",
    viewLink = "/dashboard/passenger/wallet",
    viewLabel = "View Wallet",
    continueLabel = "Top Up Again",
    onContinue,
}: PaymentSuccessProps) {
    return (
        <div className="space-y-4 text-center p-10 bg-white/50 backdrop-blur-md rounded-2xl border border-green-100 shadow-xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Thank you for using iTravas.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onContinue && (
                    <button
                        onClick={onContinue}
                        className="flex-1 px-5 py-3 bg-gray-100 text-gray-800 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                        {continueLabel}
                    </button>
                )}
                <Link href={viewLink} className="flex-1">
                    <button className="w-full px-5 py-3 bg-[#08A6F6] text-white rounded-2xl font-bold hover:bg-[#00204a] shadow-lg transition-all">
                        {viewLabel}
                    </button>
                </Link>
            </div>
        </div>
    );
}
