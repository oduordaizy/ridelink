export default function STKPushQueryLoading({ number }: { number: string }) {
    return (
        <div className="space-y-4 text-center text-black p-10 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-green-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
            <h1 className="text-xl font-bold text-gray-800 animate-pulse uppercase tracking-wider">Processing Payment</h1>
            <div className="space-y-2">
                <p className="text-gray-600">STK push sent to <span className="font-semibold text-green-700">{number}</span></p>
                <p className="text-gray-500 text-sm">Please enter your M-Pesa PIN on your phone to confirm.</p>
            </div>
        </div>
    );
}
