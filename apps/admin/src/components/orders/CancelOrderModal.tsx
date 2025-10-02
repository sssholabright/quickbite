import React, { useState } from 'react';
import { useCancelOrder } from '../../hooks/useOrders';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaExclamationTriangle,
    FaDollarSign
} from 'react-icons/fa';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    onSuccess?: () => void;
}

export default function CancelOrderModal({ 
    isOpen, 
    onClose, 
    orderId, 
    orderNumber,
    orderTotal,
    onSuccess 
}: CancelOrderModalProps) {
    const [reason, setReason] = useState('');
    const [refundAmount, setRefundAmount] = useState<number | ''>('');
    const [confirmCancel, setConfirmCancel] = useState(false);
    
    const cancelOrderMutation = useCancelOrder();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!reason.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a reason for cancellation.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        if (!confirmCancel) {
            Swal.fire({
                icon: 'warning',
                title: 'Confirmation Required',
                text: 'Please confirm that you want to cancel this order.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Cancel Order?',
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong>Order:</strong> #${orderNumber}</p>
                    <p class="mb-2"><strong>Reason:</strong> ${reason}</p>
                    ${refundAmount ? `<p class="mb-2"><strong>Refund Amount:</strong> ₦${Number(refundAmount).toLocaleString()}</p>` : ''}
                    <p class="text-red-600 text-sm">This action cannot be undone!</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Cancel Order',
            cancelButtonText: 'Keep Order',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await cancelOrderMutation.mutateAsync({
                orderId,
                request: {
                    reason: reason.trim(),
                    refundAmount: typeof refundAmount === 'number' ? refundAmount : undefined
                }
            });
            
            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Order Cancelled',
                text: `Order #${orderNumber} has been cancelled successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
            
            // Reset form
            setReason('');
            setRefundAmount('');
            setConfirmCancel(false);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Cancellation Failed',
                text: error.message || 'Failed to cancel order. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        setReason('');
        setRefundAmount('');
        setConfirmCancel(false);
        onClose();
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
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mx-4">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Cancel Order
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

                        {/* Warning */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <div className="flex">
                                <FaExclamationTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-red-800">
                                        Are you sure you want to cancel this order?
                                    </h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This action cannot be undone. The customer and vendor will be notified.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pb-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Cancellation Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Cancellation *
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                                        placeholder="Enter reason for cancellation..."
                                        maxLength={500}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {reason.length}/500 characters
                                    </p>
                                </div>

                                {/* Refund Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Refund Amount (Optional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaDollarSign className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                                            min="0"
                                            max={orderTotal}
                                            step="0.01"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave empty for no refund. Maximum: ₦{orderTotal.toLocaleString()}
                                    </p>
                                </div>

                                {/* Confirmation Checkbox */}
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="confirm-cancel"
                                            type="checkbox"
                                            checked={confirmCancel}
                                            onChange={(e) => setConfirmCancel(e.target.checked)}
                                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                            required
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="confirm-cancel" className="font-medium text-gray-700">
                                            I confirm that I want to cancel this order
                                        </label>
                                        <p className="text-gray-500">
                                            This action will notify the customer and vendor immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:flex-row-reverse space-y-2 sm:space-y-0">
                            <button
                                type="submit"
                                disabled={!reason.trim() || !confirmCancel || cancelOrderMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Keep Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}