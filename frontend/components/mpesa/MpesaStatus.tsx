import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export function STKPushQueryLoading({ number }: { number: string }) {
    return (
        <div className="space-y-4 text-center p-10 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl">
            <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 animate-pulse uppercase tracking-tight">Processing Payment...</h2>
                <p className="text-gray-600">STK push sent to <span className="font-semibold text-blue-600">{number}</span></p>
                <p className="text-sm font-medium text-gray-500">Please enter your M-Pesa PIN on your phone to confirm.</p>
            </div>
        </div>
    );
}

export function PaymentSuccess() {
    return (
        <div className="space-y-4 text-center p-10 bg-white/50 backdrop-blur-md rounded-2xl border border-green-100 shadow-xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
                <p className="text-gray-600">Your wallet has been topped up successfully.</p>
                <p className="text-sm text-gray-500">Thank you for using iTravas.</p>
            </div>
        </div>
    );
}
