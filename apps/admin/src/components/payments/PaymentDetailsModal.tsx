import React, { useState } from 'react';
import { usePaymentDetails, useRetryPayment, useProcessRefund } from '../../hooks/usePayments';
import Swal from 'sweetalert2';
import { useAdminStore } from '../../stores/adminStore';

interface PaymentDetailsModalProps {
    paymentId: string;
    onClose: () => void;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ paymentId, onClose }) => {
    const { user } = useAdminStore();
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    
    const { data: payment, isLoading, error } = usePaymentDetails(paymentId);
    const retryPaymentMutation = useRetryPayment();
    const refundPaymentMutation = useProcessRefund();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            PROCESSING: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
            SUCCESS: { color: 'bg-green-100 text-green-800', text: 'Success' },
            FAILED: { color: 'bg-red-100 text-red-800', text: 'Failed' },
            CANCELLED: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
            REFUNDED: { color: 'bg-purple-100 text-purple-800', text: 'Refunded' },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const handleRetryPayment = async () => {
        const result = await Swal.fire({
            title: 'Retry Payment',
            text: 'Are you sure you want to retry this payment?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, retry',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#EF4444',
        });

        if (result.isConfirmed) {
            try {
                await retryPaymentMutation.mutateAsync({ paymentId, request: {} });
                await Swal.fire({
                    title: 'Success',
                    text: 'Payment retry initiated successfully',
                    icon: 'success',
                    timer: 3000,
                });
            } catch (error: any) {
                await Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to retry payment',
                    icon: 'error',
                });
            }
        }
    };

    const handleRefundPayment = async () => {
        const { value: refundAmount } = await Swal.fire({
            title: 'Refund Payment',
            input: 'number',
            inputLabel: 'Refund Amount (₦)',
            inputValue: payment?.amount || 0,
            inputAttributes: {
                min: '1',
                max: payment?.amount?.toString() || '0',
                step: '1'
            },
            showCancelButton: true,
            confirmButtonText: 'Process Refund',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#EF4444',
        });

        if (refundAmount !== null) {
            const { value: reason } = await Swal.fire({
                title: 'Refund Reason',
                input: 'textarea',
                inputLabel: 'Reason for refund',
                inputPlaceholder: 'Enter reason for refund...',
                showCancelButton: true,
                confirmButtonText: 'Confirm Refund',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#EF4444',
            });

            if (reason !== null) {
                try {
                    await refundPaymentMutation.mutateAsync({
                        paymentId,
                        request: { amount: parseFloat(refundAmount), reason: reason || 'Admin refund' },
                    });
                    await Swal.fire({
                        title: 'Success',
                        text: 'Refund processed successfully',
                        icon: 'success',
                        timer: 3000,
                    });
                } catch (error: any) {
                    await Swal.fire({
                        title: 'Error',
                        text: error.message || 'Failed to process refund',
                        icon: 'error',
                    });
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading payment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payment</h3>
                        <p className="text-gray-600 mb-4">Failed to load payment details.</p>
                        <button
                            onClick={onClose}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                            <p className="text-sm text-gray-500">Transaction ID: {payment.transactionId}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'details'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Payment Details
                        </button>
                        <button
                            onClick={() => setActiveTab('actions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'actions'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Actions
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                                            <dd className="text-sm text-gray-900">{payment.transactionId}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Amount</dt>
                                            <dd className="text-sm text-gray-900 font-semibold">{formatCurrency(payment.amount)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="text-sm">{getStatusBadge(payment.status)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Gateway</dt>
                                            <dd className="text-sm text-gray-900">{payment.gateway}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                                            <dd className="text-sm text-gray-900">{payment.paymentMethod}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(payment.createdAt)}</dd>
                                        </div>
                                        {payment.completedAt && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                                                <dd className="text-sm text-gray-900">{formatDate(payment.completedAt)}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                                            <dd className="text-sm text-gray-900">{payment.customerName}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="text-sm text-gray-900">{payment.customerEmail}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="text-sm text-gray-900">{payment.customerPhone}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                                            <dd className="text-sm text-gray-900">{payment.orderNumber}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Gateway Response */}
                            {payment.gatewayResponse && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Gateway Response</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {JSON.stringify(payment.gatewayResponse, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'actions' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Actions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Retry Payment */}
                                    {payment.status === 'FAILED' && user?.permissions?.includes('payments.write') && (
                                        <button
                                            onClick={handleRetryPayment}
                                            disabled={retryPaymentMutation.isPending}
                                            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {retryPaymentMutation.isPending ? (
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            )}
                                            Retry Payment
                                        </button>
                                    )}

                                    {/* Refund Payment */}
                                    {payment.status === 'SUCCESS' && user?.permissions?.includes('payments.write') && (
                                        <button
                                            onClick={handleRefundPayment}
                                            disabled={refundPaymentMutation.isPending}
                                            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {refundPaymentMutation.isPending ? (
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            )}
                                            Refund Payment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
