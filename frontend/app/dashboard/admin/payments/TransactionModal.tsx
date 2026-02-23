'use client';

import React, { useState } from 'react';
import { IoClose, IoCash, IoTime, IoCheckmarkCircle, IoCloseCircle, IoPerson, IoReceipt, IoDocumentText, IoCalendar, IoRefresh } from 'react-icons/io5';
import { adminAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';


interface Transaction {
    id: number;
    user: string;
    amount: number;
    status: string;
    receipt: string | null;
    description: string | null;
    date: string;
}

interface TransactionModalProps {
    transaction: Transaction;
    onClose: () => void;
}

export default function TransactionModal({ transaction, onClose }: TransactionModalProps) {
    const { token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSyncStatus = async () => {
        if (!token) return;
        setIsProcessing(true);
        try {
            const res = await adminAPI.getMpesaStatus(token, transaction.id);
            alert(`Status queried: ${res.ResponseDescription || res.ResultDesc || 'Check dashboard for updates'}`);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to query transaction status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReversal = async () => {
        if (!token) return;
        if (!confirm('Are you sure you want to request a reversal for this transaction?')) return;

        setIsProcessing(true);
        try {
            const res = await adminAPI.initiateReversal(token, transaction.id, transaction.amount, 'Admin requested reversal');
            alert(`Reversal initiated: ${res.ResponseDescription || res.ResultDesc || 'Request sent successfully'}`);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to initiate reversal');
        } finally {
            setIsProcessing(false);
        }
    };

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#00204a] p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Transaction Details</h2>
                        <p className="text-blue-200 text-sm">#{transaction.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 ${transaction.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                        transaction.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                        {transaction.status === 'success' ? <IoCheckmarkCircle size={28} /> :
                            transaction.status === 'failed' ? <IoCloseCircle size={28} /> :
                                <IoTime size={28} />}
                        <div className="font-bold capitalize text-lg">{transaction.status}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <DetailItem
                            icon={<IoPerson className="text-[#08A6F6]" />}
                            label="Customer"
                            value={transaction.user}
                        />
                        <DetailItem
                            icon={<IoCash className="text-[#08A6F6]" />}
                            label="Amount Paid"
                            value={`KSh ${transaction.amount.toLocaleString()}`}
                            isBold
                        />
                        <DetailItem
                            icon={<IoReceipt className="text-[#08A6F6]" />}
                            label="M-Pesa Receipt"
                            value={transaction.receipt || '---'}
                        />
                        <DetailItem
                            icon={<IoCalendar className="text-[#08A6F6]" />}
                            label="Date & Time"
                            value={new Date(transaction.date).toLocaleString()}
                        />
                        <DetailItem
                            icon={<IoDocumentText className="text-[#08A6F6]" />}
                            label="Description"
                            value={transaction.description || 'No additional details provided.'}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 space-y-3">
                    <div className="flex space-x-3">
                        {transaction.status === 'pending' && (
                            <button
                                onClick={handleSyncStatus}
                                disabled={isProcessing}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl transition-colors flex items-center justify-center space-x-2"
                            >
                                <IoRefresh className={isProcessing ? 'animate-spin' : ''} size={20} />
                                <span>Sync Status</span>
                            </button>
                        )}
                        {transaction.status === 'success' && (
                            <button
                                onClick={handleReversal}
                                disabled={isProcessing}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-2xl transition-colors flex items-center justify-center space-x-2"
                            >
                                <IoCloseCircle size={20} />
                                <span>{isProcessing ? 'Processing...' : 'Request Reversal'}</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#00204a] font-bold rounded-2xl transition-colors"
                    >
                        Close Details
                    </button>
                </div>

            </div>
        </div>
    );
}

function DetailItem({ icon, label, value, isBold = false }: { icon: React.ReactNode, label: string, value: string, isBold?: boolean }) {
    return (
        <div className="flex items-start space-x-4">
            <div className="mt-1 text-xl">{icon}</div>
            <div className="flex-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                <p className={`${isBold ? 'text-lg font-bold text-[#00204a]' : 'text-gray-700'} mt-0.5`}>{value}</p>
            </div>
        </div>
    );
}
