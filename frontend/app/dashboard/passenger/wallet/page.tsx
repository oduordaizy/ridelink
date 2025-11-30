'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, Wallet, Loader2, CreditCard, Smartphone, Globe, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { paymentAPI } from "@/app/services/api"
import { useAuth } from "@/app/contexts/AuthContext"
import PassengerNavbar from '@/app/components/PassengerNavbar';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
}

type PaymentMethod = 'mpesa' | 'card' | 'paypal';

export default function WalletPage() {
  const { user, token, logout } = useAuth()
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [activeTab, setActiveTab] = useState<PaymentMethod>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null)

  // Fetch wallet data on component mount
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!token) return
      
      try {
        setIsLoadingBalance(true)
        const [balanceRes, transactionsRes] = await Promise.all([
          paymentAPI.getWalletBalance(token),
          paymentAPI.getWalletTransactions(token)
        ])
        
        console.log('=== DEBUG: Wallet API Response ===');
        console.log('Full response:', balanceRes);
        
        // Improved balance extraction with proper error handling
        let backendBalance = 0;
        
        if (balanceRes && typeof balanceRes === 'object') {
          // Check both possible response structures
          if ('data' in balanceRes && balanceRes.data && typeof balanceRes.data === 'object' && 'balance' in balanceRes.data) {
            // Handle response with data wrapper: { data: { balance: number, ... } }
            const balanceValue = Number(balanceRes.data.balance);
            if (!isNaN(balanceValue)) {
              backendBalance = balanceValue;
            } else {
              throw new Error('Balance is not a valid number');
            }
          } else if ('balance' in balanceRes) {
            // Handle direct balance in response: { balance: number, ... }
            const balanceValue = Number(balanceRes.balance);
            if (!isNaN(balanceValue)) {
              backendBalance = balanceValue;
            } else {
              throw new Error('Balance is not a valid number');
            }
          } else {
            throw new Error('Invalid balance response structure');
          }
        } else {
          throw new Error('Invalid API response');
        }
        
        console.log('Setting wallet balance to:', backendBalance);
        setBalance(backendBalance)
        setTransactions(transactionsRes.transactions || [])
      } catch (error) {
        console.error('Error fetching wallet data:', error)
        toast.error('Error', {
          description: error instanceof Error ? error.message : 'Failed to load wallet data'
        })
        setBalance(null)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchWalletData()
  }, [token])

  // Poll for payment status with improved logic
  useEffect(() => {
    if (!activePaymentId || !isPolling || !token) {
      return;
    }

    let pollAttempts = 0;
    const MAX_ATTEMPTS = 40; // 2 minutes at 3s intervals

    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      if (pollAttempts > MAX_ATTEMPTS) {
        clearInterval(pollInterval);
        setIsPolling(false);
        setActivePaymentId(null);
        toast.error('Payment Timeout', {
          description: 'Payment verification timed out. Please check your transaction history.'
        });
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/status/${activePaymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Failed to check payment status');
          return; // Continue polling
        }
        
        const { status } = await response.json();
        
        if (status === 'completed') {
          clearInterval(pollInterval);
          setIsPolling(false);
          setActivePaymentId(null);
          
          // Refresh wallet data
          try {
            const [balanceRes, transactionsRes] = await Promise.all([
              paymentAPI.getWalletBalance(token),
              paymentAPI.getWalletTransactions(token)
            ]);
            
            // Extract balance based on response structure
            const newBalance = balanceRes.data?.balance ?? balanceRes.balance;
            setBalance(Number(newBalance));
            setTransactions(transactionsRes.transactions || []);
            
            toast.success('Payment Successful', {
              description: 'Your wallet has been topped up successfully!'
            });
          } catch (error) {
            console.error('Error refreshing wallet data:', error);
            toast.error('Error', {
              description: 'Payment was successful, but we had trouble updating your balance. Please refresh the page.'
            });
          }
        } else if (status === 'failed' || status === 'reversed' || status === 'cancelled') {
          clearInterval(pollInterval);
          setIsPolling(false);
          setActivePaymentId(null);
          
          const messages: Record<string, string> = {
            reversed: 'The payment was reversed. The amount will be refunded to your M-Pesa account.',
            cancelled: 'The payment was cancelled. No amount was deducted from your account.',
            failed: 'Payment failed. Please try again.'
          };
          
          toast.error('Payment Failed', {
            description: messages[status] || messages.failed,
            duration: 10000
          });
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        // Don't clear the interval on network errors, let it retry
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [activePaymentId, isPolling, token])

  // Validate and format phone number
  const validateAndFormatPhone = (phone: string): string | null => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    // Validate: Must be 254 + (7 or 1) + 8 digits
    if (!/^254[17]\d{8}$/.test(cleaned)) {
      return null;
    }
    
    return cleaned;
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountValue = parseFloat(amount)
    
    if (isNaN(amountValue) || amountValue < 1) {
      toast.error("Invalid amount", {
        description: "Please enter an amount of KES 1 or more"
      })
      return
    }

    if (activeTab === 'mpesa') {
      await handleMpesaPayment(amountValue)
    } else {
      // Handle other payment methods
      toast.info("Coming Soon", {
        description: `${activeTab.toUpperCase()} payment integration is coming soon!`
      })
    }
  }

  const handleMpesaPayment = async (amount: number) => {
    if (!token) {
      toast.error("Authentication required", {
        description: "Please log in to continue"
      })
      return
    }

    // Validate and format phone number
    const formattedPhone = validateAndFormatPhone(phoneNumber);
    if (!formattedPhone) {
      toast.error("Invalid phone number", {
        description: "Please enter a valid M-Pesa phone number (e.g., 0712345678)"
      })
      return
    }

    setIsLoading(true)
    let toastId: string | number = '';
    
    try {
      // Show processing toast
      toastId = toast.loading('Initiating M-Pesa payment...', {
        description: 'Please wait while we process your request'
      })

      // Initiate M-Pesa payment
      const response = await paymentAPI.initiateMpesaPayment(token, {
        phone_number: formattedPhone,
        amount: amount
      });

      // Check if response contains error
      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.payment_id) {
        throw new Error('Failed to initiate payment. Please try again.');
      }

      // Update UI with payment reference
      setActivePaymentId(response.payment_id);
      setIsPolling(true);
      
      toast.dismiss(toastId);
      
      toast.info('Enter M-Pesa PIN', {
        description: 'Check your phone and enter your M-Pesa PIN to complete the payment',
        duration: 10000
      });
      
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      
      // Dismiss any existing loading toasts
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      // Handle specific error cases
      let errorMessage = 'Failed to initiate M-Pesa payment. Please try again.';
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient M-Pesa balance. Please top up your M-Pesa account and try again.';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('invalid phone')) {
          errorMessage = 'Invalid phone number. Please enter a valid M-Pesa registered number.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Payment Failed', {
        description: errorMessage,
        duration: 10000
      });
      
      // Reset form only on certain errors
      if (!(error instanceof Error) || (!error.message?.includes('insufficient funds') && !error.message?.includes('invalid phone'))) {
        setAmount('');
        setPhoneNumber('');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Render payment method form
  const renderPaymentMethodForm = () => {
    switch (activeTab) {
      case 'mpesa':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">+254</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading || isPolling}
                  className="pl-14"
                />
              </div>
              <p className="text-xs text-gray-500">Enter your M-Pesa registered phone number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || isPolling}
              />
              <p className="text-xs text-gray-500">Minimum amount: KES 1</p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={isLoading || isPolling || !phoneNumber || !amount}
            >
              {isLoading || isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPolling ? 'Processing Payment...' : 'Initiating...'}
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Pay with M-Pesa</span>
                </div>
              )}
            </Button>
            {isPolling && (
              <div className="text-center text-sm text-blue-600 mt-2">
                <p>Check your phone to complete the payment</p>
                <p className="text-xs text-gray-500 mt-1">
                  This may take a moment...
                </p>
              </div>
            )}
          </div>
        )
      
      case 'card':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card Details</Label>
              <Input placeholder="Card number" disabled={true} />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input placeholder="MM/YY" disabled={true} />
                <Input placeholder="CVC" disabled={true} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount-card">Amount (KES)</Label>
              <Input
                id="amount-card"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="button" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                toast.info('Coming Soon', {
                  description: 'Credit card payment integration is coming soon!'
                })
              }}
              disabled={isLoading}
            >
              Pay with Card
            </Button>
          </div>
        )
      
      case 'paypal':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-4">You&apos;ll be redirected to PayPal to complete your payment</p>
              <div className="space-y-2">
                <Label htmlFor="amount-paypal">Amount (KES)</Label>
                <Input
                  id="amount-paypal"
                  type="number"
                  min="10"
                  step="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button 
              type="button" 
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900"
              onClick={() => {
                toast.info('Coming Soon', {
                  description: 'PayPal integration is coming soon!'
                })
              }}
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" />
                <span>Pay with PayPal</span>
              </div>
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="space-y-8 bg-blue-50 p-4 min-h-screen">
      <PassengerNavbar 
        user={{
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email
        }} 
        onLogout={logout} 
      />
      <div className="max-w-6xl mx-auto">
        {/* Balance Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Available Balance</p>
                <h2 className="text-4xl font-bold mt-2">
                  {isLoadingBalance ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : balance !== null ? (
                    formatCurrency(balance)
                  ) : (
                    <span className="text-2xl">Unable to load balance</span>
                  )}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Last updated: {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          {/* Top Up Section */}
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Up Wallet</h3>
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value as PaymentMethod)
                  setAmount('')
                  setPhoneNumber('')
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="mpesa" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>M-Pesa</span>
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>PayPal</span>
                  </TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleTopUp}>
                  {renderPaymentMethodForm()}
                </form>
              </Tabs>
            </div>
            
            {/* Quick Top-Up Buttons */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Top-Up</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[100, 200, 500, 1000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    className="hover:bg-blue-50"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={isLoading || isPolling}
                  >
                    KES {quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your transaction history for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Your transactions will appear here</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {formatDate(tx.date)}
                          {tx.reference && (
                            <p className="text-xs text-gray-500 mt-1">Ref: {tx.reference}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.amount > 0 ? (
                              <ArrowDown className="text-green-600 w-4 h-4" />
                            ) : (
                              <ArrowUp className="text-red-600 w-4 h-4" />
                            )}
                            {tx.type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {tx.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : tx.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                            )}
                            <span className={`text-sm capitalize ${
                              tx.status === 'completed' ? 'text-green-700' : 
                              tx.status === 'failed' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}