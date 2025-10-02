import React, { useState } from 'react';
import { useRefundOrder } from '../../hooks/useOrders';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaUndo,
    FaDollarSign,
    FaCheckCircle
} from 'react-icons/fa';

interface RefundOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    onSuccess?: () => void;
}

export default function RefundOrderModal({ 
    isOpen, 
    onClose, 
    orderId, 
    orderNumber,
    orderTotal,
    onSuccess 
}: RefundOrderModalProps) {
    const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [confirmRefund, setConfirmRefund] = useState(false);
    
    const refundOrderMutation = useRefundOrder();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!reason.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a reason for the refund.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        if (!isValidAmount()) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Amount',
                text: 'Please enter a valid refund amount.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        if (!confirmRefund) {
            Swal.fire({
                icon: 'warning',
                title: 'Confirmation Required',
                text: 'Please confirm this refund.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const refundAmount = refundType === 'FULL' ? orderTotal : (amount as number);

        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Process Refund?',
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong>Order:</strong> #${orderNumber}</p>
                    <p class="mb-2"><strong>Refund Type:</strong> ${refundType}</p>
                    <p class="mb-2"><strong>Amount:</strong> ₦${refundAmount.toLocaleString()}</p>
                    <p class="mb-2"><strong>Reason:</strong> ${reason}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Process Refund',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await refundOrderMutation.mutateAsync({
                orderId,
                request: {
                    amount: refundAmount,
                    reason: reason.trim(),
                    refundType
                }
            });
            
            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Refund Processed',
                text: `Refund of ₦${refundAmount.toLocaleString()} has been processed successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
            
            // Reset form
            setRefundType('PARTIAL');
            setAmount('');
            setReason('');
            setConfirmRefund(false);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Refund Failed',
                text: error.message || 'Failed to process refund. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        setRefundType('PARTIAL');
        setAmount('');
        setReason('');
        setConfirmRefund(false);
        onClose();
    };

    const handleRefundTypeChange = (type: 'FULL' | 'PARTIAL') => {
        setRefundType(type);
        if (type === 'FULL') {
            setAmount(orderTotal);
        } else {
            setAmount('');
        }
    };

    const isValidAmount = () => {
        if (refundType === 'FULL') return true;
        const numAmount = amount as number;
        return typeof numAmount === 'number' && numAmount > 0 && numAmount <= orderTotal;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={handleClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaUndo className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Process Refund
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Order #{orderNumber}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Total */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Order Total:</span>
                                <span className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaDollarSign className="w-4 h-4 mr-1" />
                                    ₦{orderTotal.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pb-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Refund Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Refund Type *
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="refundType"
                                                value="FULL"
                                                checked={refundType === 'FULL'}
                                                onChange={() => handleRefundTypeChange('FULL')}
                                                className="sr-only"
                                            />
                                            <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 ${
                                                refundType === 'FULL' 
                                                    ? 'border-green-500 bg-green-500' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {refundType === 'FULL' && (
                                                    <FaCheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Full Refund</p>
                                                <p className="text-sm text-gray-500">Refund the complete order amount</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                ₦{orderTotal.toLocaleString()}
                                            </span>
                                        </label>

                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="refundType"
                                                value="PARTIAL"
                                                checked={refundType === 'PARTIAL'}
                                                onChange={() => handleRefundTypeChange('PARTIAL')}
                                                className="sr-only"
                                            />
                                            <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 ${
                                                refundType === 'PARTIAL' 
                                                    ? 'border-green-500 bg-green-500' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {refundType === 'PARTIAL' && (
                                                    <FaCheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Partial Refund</p>
                                                <p className="text-sm text-gray-500">Refund a specific amount</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Refund Amount */}
                                {refundType === 'PARTIAL' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Refund Amount *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaDollarSign className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                                min="0"
                                                max={orderTotal}
                                                step="0.01"
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₦{orderTotal.toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* Refund Amount Display */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-800">Refund Amount:</span>
                                        <span className="text-lg font-semibold text-green-900 flex items-center">
                                            <FaDollarSign className="w-4 h-4 mr-1" />
                                            ₦{refundType === 'FULL' ? orderTotal.toLocaleString() : (amount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Refund Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Refund *
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        placeholder="Enter reason for refund..."
                                        maxLength={500}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {reason.length}/500 characters
                                    </p>
                                </div>

                                {/* Confirmation Checkbox */}
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="confirm-refund"
                                            type="checkbox"
                                            checked={confirmRefund}
                                            onChange={(e) => setConfirmRefund(e.target.checked)}
                                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                            required
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="confirm-refund" className="font-medium text-gray-700">
                                            I confirm this refund amount and reason
                                        </label>
                                        <p className="text-gray-500">
                                            This action will process the refund immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={!reason.trim() || !isValidAmount() || !confirmRefund || refundOrderMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {refundOrderMutation.isPending ? 'Processing...' : 'Process Refund'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
