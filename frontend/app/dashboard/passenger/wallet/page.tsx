'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, ArrowUpCircle, History, X, CheckCircle, AlertCircle, Loader2, Car, Banknote, Download } from 'lucide-react';
import React from 'react';
import { API_BASE_URL } from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { STKPushQueryLoading, PaymentSuccess } from '@/components/mpesa/MpesaStatus';

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
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
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

export default function PassengerWallet() {
  // Get authenticated user from context
  const { user } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mpesa' | ''>('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTransactions = transactions.filter(tx => activeFilter === 'all' || tx.category === activeFilter);

  // Fetch wallet data on component mount
  useEffect(() => {
    const fetchWalletData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        // Fetch Balance
        const balanceRes = await fetch(`${API_BASE_URL}/payments/wallet/balance/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData.balance);
        }

        // Pre-fill phones if available
        if (user?.phone_number) {
          const formattedPhone = user.phone_number.startsWith('0')
            ? '254' + user.phone_number.substring(1)
            : user.phone_number.replace('+', '');
          if (!mpesaPhone) setMpesaPhone(formattedPhone);
          if (!withdrawPhone) setWithdrawPhone(formattedPhone);
        }

        // Fetch Transactions
        const transactionsRes = await fetch(`${API_BASE_URL}/payments/wallet/transactions/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        showToast('Failed to load wallet data', 'error');
      } finally {
        setIsLoadingBalance(false);
        setIsLoadingTransactions(false);
      }
    };

    fetchWalletData();
  }, []);

  // Show toast notification
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Calculate stats from transactions
  const stats = {
    thisMonth: transactions
      .filter(tx => {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        return tx.status === 'success' &&
          tx.amount > 0 &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalTopups: transactions
      .filter(tx => tx.status === 'success' && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
    pending: transactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + tx.amount, 0)
  };

  const stkPushQueryWithIntervals = (CheckoutRequestID: string) => {
    let reqcount = 0;
    const STILL_PROCESSING_CODES = ['500.001.1001', '500.001.1000', '1'];
    const MAX_ATTEMPTS = 25; // 25 × 3s = 75 seconds

    const timer = setInterval(async () => {
      reqcount += 1;

      if (reqcount >= MAX_ATTEMPTS) {
        clearInterval(timer);
        setStkQueryLoading(false);
        setIsProcessing(false);
        showToast("You took too long to pay. If you have paid, your balance will reflect shortly.", "error");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/payments/mpesa/query/?checkout_request_id=${CheckoutRequestID}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }
        });

        if (!response.ok) {
          return; // Transient error, keep polling
        }

        const data = await response.json();

        // Check for 500.001.1001 'still processing' — keep polling
        const mpesaErrorCode = String(data.errorCode || '');
        // treat numeric '1' and any text mentioning "processing" as still-processing
        if (STILL_PROCESSING_CODES.includes(mpesaErrorCode) || /processing/i.test(data.ResultDesc || '')) {
          return;
        }

        // internal_status is the most reliable source (set by our backend)
        if (data.internal_status === "success") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setSuccess(true);
          setIsProcessing(false);
          return;
        } else if (data.internal_status === "failed") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setIsProcessing(false);
          showToast(data.internal_result_desc || data.ResultDesc || 'Payment failed', 'error');
          return;
        } else if (data.internal_status === "pending") {
          return; // Still processing — keep polling
        }

        // Fallback to raw M-Pesa ResultCode only for definitive final codes
        if (data.ResultCode !== undefined && data.ResultCode !== null) {
          if (String(data.ResultCode) === "0") {
            clearInterval(timer);
            setStkQueryLoading(false);
            setSuccess(true);
            setIsProcessing(false);
          } else if (!STILL_PROCESSING_CODES.includes(String(data.ResultCode)) && !/processing/i.test(data.ResultDesc || '')) {
            clearInterval(timer);
            setStkQueryLoading(false);
            setIsProcessing(false);
            showToast(data.ResultDesc || 'Payment failed', 'error');
          }
        }
      } catch (error) {
        console.error('Query error:', error);
      }
    }, 3000);
  };

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

    if (amount < 1) {
      showToast('Minimum top-up amount is KES 1', 'error');
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
      if (paymentMethod === 'mpesa') {
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
        setStkQueryLoading(true);
        stkPushQueryWithIntervals(data.checkout_request_id);

      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      showToast('Please enter amount and phone number', 'error');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (balance !== null && amount > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    if (!/^254\d{9}$/.test(withdrawPhone)) {
      showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/payments/wallet/withdraw/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          amount: amount,
          phone: withdrawPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      setWithdrawSuccess(true);
      // Refresh balance after a short delay since withdrawal is pending
      setTimeout(async () => {
        const token = localStorage.getItem('access_token');
        const balanceRes = await fetch(`${API_BASE_URL}/payments/wallet/balance/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData.balance);
        }
      }, 2000);

    } catch (error) {
      console.error('Withdrawal error:', error);
      showToast(error instanceof Error ? error.message : 'Withdrawal failed', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  const getTransactionReferenceLabel = (tx: any) => {
    if (tx.mpesa_receipt_number) {
      return tx.mpesa_receipt_number;
    }

    if (tx.status === 'success') {
      return 'Completed';
    }

    if (tx.status === 'failed') {
      return 'Failed';
    }

    return 'Pending';
  };

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
              <span className="text-xs md:text-sm text-[#08A6F6]">Active</span>
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
                `KSh ${(balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-xs md:text-sm opacity-80">Last updated: {new Date().toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 bg-white text-[#08A6F6] font-semibold py-3 rounded-lg md:rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5" />
              Top Up Wallet
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-transparent border-2 border-white text-white font-semibold py-3 rounded-lg md:rounded-xl hover:bg-white hover:text-[#08A6F6] transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1 uppercase font-bold tracking-tighter">This Month</p>
            <p className="text-xl md:text-2xl font-bold text-[#00204a]">
              KSh {stats.thisMonth.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1 uppercase font-bold tracking-tighter">Total Top-ups</p>
            <p className="text-xl md:text-2xl font-bold text-[#00204a]">
              KSh {stats.totalTopups.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-xs md:text-sm mb-1 uppercase font-bold tracking-tighter">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-[#08A6F6]">
              KSh {stats.pending.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Transactions</h2>
            </div>
            
            {/* Filters */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
              {['all', 'topups', 'withdrawals', 'payments', 'earnings'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeFilter === filter 
                    ? 'bg-[#00204a] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {isLoadingTransactions ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <History className="w-12 h-12 mb-2 opacity-20" />
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start md:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 gap-3"
                >
                  <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        tx.category === 'topups' ? 'bg-[#e0f4ff]' :
                        tx.category === 'payments' ? 'bg-purple-100' :
                        tx.category === 'withdrawals' ? 'bg-red-100' :
                        tx.category === 'earnings' ? 'bg-green-100' :
                        tx.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {tx.category === 'topups' ? <Wallet className="w-5 h-5 md:w-6 md:h-6 text-[#08A6F6]" /> :
                       tx.category === 'payments' ? <Car className="w-5 h-5 md:w-6 md:h-6 text-purple-600" /> :
                       tx.category === 'withdrawals' ? <Download className="w-5 h-5 md:w-6 md:h-6 text-red-600" /> :
                       tx.category === 'earnings' ? <Banknote className="w-5 h-5 md:w-6 md:h-6 text-green-600" /> :
                       tx.amount >= 0 ? <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" /> : 
                       <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 rotate-180" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#00204a] text-sm md:text-base leading-tight mb-1">
                        {tx.title || tx.details}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] md:text-sm text-gray-500 font-medium break-words">
                          {tx.description && <span className="mr-1">{tx.description} •</span>}
                          {getTransactionReferenceLabel(tx)}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
                          {new Date(tx.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })} • {new Date(tx.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className={`font-black text-sm md:text-lg ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {tx.amount >= 0 ? '+' : ''}KSh {Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <span className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${tx.status === 'success' ? 'bg-green-50 text-green-700 border-green-100' :
                      tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
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

            {stkQueryLoading ? (
              <STKPushQueryLoading number={mpesaPhone} />
            ) : success ? (
              <PaymentSuccess
                title="Top Up Successful!"
                message="Your wallet has been topped up successfully."
                viewLink="/dashboard/passenger/wallet"
                viewLabel="View Wallet"
                continueLabel="Top Up Again"
                onContinue={() => { setSuccess(false); setTopUpAmount(''); setMpesaPhone(''); }}
                onView={() => window.location.reload()}
              />
            ) : (
              <>
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-semibold">KSh</span>
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
                    `Top Up KSh ${topUpAmount || '0'}`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Withdraw Funds</h2>
            <p className="text-gray-600 text-sm mb-6">Withdraw money from your wallet to M-Pesa</p>

            {withdrawSuccess ? (
              <PaymentSuccess
                title="Withdrawal Requested!"
                message="Your withdrawal request has been received and is being processed. You will receive an M-Pesa notification shortly."
                viewLink="/dashboard/passenger/wallet"
                viewLabel="View Wallet"
                continueLabel="Make Another Withdrawal"
                onContinue={() => { setWithdrawSuccess(false); setWithdrawAmount(''); }}
                onView={() => window.location.reload()}
              />
            ) : (
              <>
                {/* Balance Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Available for withdrawal</p>
                  <p className="text-xl font-bold text-[#00204a]">KSh {(balance || 0).toLocaleString()}</p>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-semibold">KSh</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#08A6F6] focus:outline-none text-lg"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#08A6F6] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">Funds will be sent to this M-Pesa number.</p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full bg-[#08A6F6] text-white font-semibold py-4 rounded-xl hover:bg-[#00204a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Payout...
                    </>
                  ) : (
                    `Withdraw KSh ${withdrawAmount || '0'}`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
