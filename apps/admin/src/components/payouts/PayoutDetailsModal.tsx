import React, { useState } from 'react';
import { usePayoutDetails, useUpdatePayout } from '../../hooks/usePayouts';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';

interface PayoutDetailsModalProps {
    payoutId: string;
    onClose: () => void;
}

const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({ payoutId, onClose }) => {
    const { user } = useAdminStore();
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    
    const { data: payout, isLoading, error } = usePayoutDetails(payoutId);
    const updatePayoutMutation = useUpdatePayout();

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
            REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getRecipientTypeBadge = (type: string) => {
        const typeConfig = {
            VENDOR: { color: 'bg-green-100 text-green-800', text: 'Vendor' },
            RIDER: { color: 'bg-blue-100 text-blue-800', text: 'Rider' },
        };

        const config = typeConfig[type as keyof typeof typeConfig];
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const handleCancelPayout = async () => {
        const result = await Swal.fire({
            title: 'Cancel Payout',
            text: 'Are you sure you want to cancel this payout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel',
            cancelButtonText: 'Keep payout',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#3B82F6',
        });

        if (result.isConfirmed) {
            try {
                await updatePayoutMutation.mutateAsync({ 
                    payoutId, 
                    request: { status: 'CANCELLED' } 
                });
                await Swal.fire({
                    title: 'Success',
                    text: 'Payout cancelled successfully',
                    icon: 'success',
                    timer: 3000,
                });
            } catch (error: any) {
                await Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to cancel payout',
                    icon: 'error',
                });
            }
        }
    };

    const handleRetryPayout = async () => {
        const result = await Swal.fire({
            title: 'Retry Payout',
            text: 'Are you sure you want to retry this payout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, retry',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#EF4444',
        });

        if (result.isConfirmed) {
            try {
                await updatePayoutMutation.mutateAsync({ 
                    payoutId, 
                    request: { status: 'PENDING' } 
                });
                await Swal.fire({
                    title: 'Success',
                    text: 'Payout retry initiated successfully',
                    icon: 'success',
                    timer: 3000,
                });
            } catch (error: any) {
                await Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to retry payout',
                    icon: 'error',
                });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading payout details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !payout) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payout</h3>
                        <p className="text-gray-600 mb-4">Failed to load payout details.</p>
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
                            <h2 className="text-xl font-semibold text-gray-900">Payout Details</h2>
                            <p className="text-sm text-gray-500">Payout ID: {payout.payoutId}</p>
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
                            Payout Details
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
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Payout ID</dt>
                                            <dd className="text-sm text-gray-900">{payout.payoutId}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Amount</dt>
                                            <dd className="text-sm text-gray-900 font-semibold">{formatCurrency(payout.amount)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="text-sm">{getStatusBadge(payout.status)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Recipient Type</dt>
                                            <dd className="text-sm">{getRecipientTypeBadge(payout.recipientType)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(payout.createdAt)}</dd>
                                        </div>
                                        {payout.processedAt && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Processed At</dt>
                                                <dd className="text-sm text-gray-900">{formatDate(payout.processedAt)}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                                            <dd className="text-sm text-gray-900">{payout.recipientName}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="text-sm text-gray-900">{payout.recipientEmail}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                                            <dd className="text-sm text-gray-900">{payout.bankName}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                                            <dd className="text-sm text-gray-900">{payout.accountNumber}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                                            <dd className="text-sm text-gray-900">{payout.accountName}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Notes */}
                            {payout.notes && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">{payout.notes}</p>
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
                                    {/* Cancel Payout */}
                                    {(payout.status === 'PENDING' || payout.status === 'PROCESSING') && user?.permissions?.includes('payouts.write') && (
                                        <button
                                            onClick={handleCancelPayout}
                                            disabled={updatePayoutMutation.isPending}
                                            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatePayoutMutation.isPending ? (
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            Cancel Payout
                                        </button>
                                    )}

                                    {/* Retry Payout */}
                                    {payout.status === 'FAILED' && user?.permissions?.includes('payouts.write') && (
                                        <button
                                            onClick={handleRetryPayout}
                                            disabled={updatePayoutMutation.isPending}
                                            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatePayoutMutation.isPending ? (
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            )}
                                            Retry Payout
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

export default PayoutDetailsModal;
