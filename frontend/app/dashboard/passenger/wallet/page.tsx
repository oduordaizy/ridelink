'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, ArrowUpCircle, History, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React from 'react';
import { API_BASE_URL } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';

// Add animation styles
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Types
type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

interface ToastState {
  message: string;
  type: ToastType;
}

// Toast Component
const Toast = ({ message, type, onClose }: ToastProps) => {
  const icons: Record<ToastType, React.ReactElement> = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${colors[type]} animate-slide-in max-w-sm`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function DriverWallet() {
  // Get authenticated user from context
  const { user } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Fetch wallet balance on component mount
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/payments/wallet/balance/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wallet balance');
        }

        const data = await response.json();
        setBalance(data.balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        showToast('Failed to load wallet balance', 'error');
        setBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, []);

  // Show toast notification
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mock transaction history
  const [transactions] = useState([
    { id: 1, type: 'top-up', amount: 1000, method: 'M-Pesa', date: '2024-12-04', status: 'completed' },
    { id: 2, type: 'top-up', amount: 500, method: 'Card', date: '2024-12-03', status: 'completed' },
    { id: 3, type: 'deduction', amount: -200, method: 'Commission', date: '2024-12-02', status: 'completed' },
    { id: 4, type: 'top-up', amount: 1500, method: 'M-Pesa', date: '2024-12-01', status: 'completed' },
  ]);

  const handleTopUp = async () => {
    if (!topUpAmount || !paymentMethod) {
      showToast('Please enter amount and select payment method', 'error');
      return;
    }

    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (amount < 10) {
      showToast('Minimum top-up amount is KES 10', 'error');
      return;
    }

    if (paymentMethod === 'mpesa' && !mpesaPhone) {
      showToast('Please enter your M-Pesa phone number', 'error');
      return;
    }

    if (paymentMethod === 'mpesa' && !/^254\d{9}$/.test(mpesaPhone)) {
      showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'card') {
        // Stripe Integration - Consistent with M-Pesa pattern
        const response = await fetch(`${API_BASE_URL}/checkout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            amount: amount,
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error data:', errorData);

          // If 401, token is invalid
          if (response.status === 401) {
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
            return;
          }

          throw new Error(errorData.error || errorData.detail || 'Failed to create checkout session');
        }

        const data = await response.json();
        console.log('Checkout response:', data);

        if (!data.checkout_url) {
          throw new Error('No checkout URL received from server');
        }

        // Redirect to Stripe Checkout
        showToast('Redirecting to Stripe checkout...', 'info');
        window.location.href = data.checkout_url;

      } else if (paymentMethod === 'mpesa') {
        // M-Pesa Integration - Same pattern
        const response = await fetch(`${API_BASE_URL}/payments/wallet/topup/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            amount: amount,
            payment_method: 'mpesa',
            phone: mpesaPhone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error data:', errorData);

          if (response.status === 401) {
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
            return;
          }

          throw new Error(errorData.error || errorData.detail || 'Failed to initiate M-Pesa payment');
        }

        const data = await response.json();
        showToast(`M-Pesa STK Push sent to ${mpesaPhone}. Check your phone to complete payment.`, 'success');

        // Close modal after success
        setTimeout(() => {
          setShowTopUpModal(false);
          setTopUpAmount('');
          setPaymentMethod('');
          setMpesaPhone('');
        }, 2000);
      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Add styles */}
      <style>{styles}</style>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Hello, {user?.first_name || 'Driver'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">Manage your wallet and top-ups</p>
        </div>

        {/* Balance Card */}
        <div
          className="rounded-xl md:rounded-2xl p-6 md:p-8 mb-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #08A6F6 0%, #00204a 100%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-base md:text-lg opacity-90">Available Balance</span>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
              <span className="text-xs md:text-sm">Active</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-3xl md:text-5xl font-bold mb-1">
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-2xl">Loading...</span>
                </div>
              ) : (
                `KES ${(balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-xs md:text-sm opacity-80">Last updated: {new Date().toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>

          <button
            onClick={() => setShowTopUpModal(true)}
            className="w-full bg-white text-[#08A6F6] font-semibold py-3 rounded-lg md:rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5" />
            Top Up Wallet
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1">This Month</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">KES 12,450</p>
          </div>
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1">Total Top-ups</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">KES 45,200</p>
          </div>
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">KES 0.00</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Transactions</h2>
          </div>

          <div className="space-y-2 md:space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${transaction.type === 'top-up' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                  >
                    {transaction.type === 'top-up' ? (
                      <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 rotate-180" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                      {transaction.type === 'top-up' ? 'Top Up' : 'Deduction'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {transaction.method} • {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-base md:text-lg ${transaction.type === 'top-up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {transaction.type === 'top-up' ? '+' : ''}KES {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <span className="text-xs text-gray-500 capitalize">{transaction.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Up Wallet</h2>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-semibold">KES</span>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#08A6F6] focus:outline-none text-lg"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount.toString())}
                  className="py-2 px-3 bg-[#C0DFED] text-[#003870] rounded-lg hover:bg-[#08A6F6] hover:text-white transition-colors text-sm font-semibold"
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Payment Method
              </label>

              <div className="space-y-3">
                {/* Card Payment */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'card'
                    ? 'border-[#08A6F6] bg-[#C0DFED] bg-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'card' ? 'bg-[#08A6F6]' : 'bg-gray-100'
                    }`}>
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Card Payment</p>
                    <p className="text-sm text-gray-600">Pay with Visa, Mastercard</p>
                  </div>
                </button>

                {/* M-Pesa Payment */}
                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'mpesa'
                    ? 'border-[#08A6F6] bg-[#C0DFED] bg-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'mpesa' ? 'bg-[#08A6F6]' : 'bg-gray-100'
                    }`}>
                    <Smartphone className={`w-6 h-6 ${paymentMethod === 'mpesa' ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">M-Pesa</p>
                    <p className="text-sm text-gray-600">Pay via STK Push</p>
                  </div>
                </button>
              </div>
            </div>

            {/* M-Pesa Phone Number */}
            {paymentMethod === 'mpesa' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="254712345678"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#08A6F6] focus:outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleTopUp}
              disabled={isProcessing}
              className="w-full bg-[#08A6F6] text-white font-semibold py-4 rounded-xl hover:bg-[#00204a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Top Up KES ${topUpAmount || '0'}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}