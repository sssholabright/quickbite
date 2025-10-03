import React, { useState } from 'react';
import { useCreatePayout, useWalletsList } from '../../hooks/usePayouts';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';

interface CreatePayoutModalProps {
    onClose: () => void;
}

const CreatePayoutModal: React.FC<CreatePayoutModalProps> = ({ onClose }) => {
    const { user } = useAdminStore();
    const [formData, setFormData] = useState({
        recipientId: '',
        recipientType: 'VENDOR' as 'VENDOR' | 'RIDER',
        amount: '',
        notes: '',
    });

    const createPayoutMutation = useCreatePayout();
    const { data: walletsData } = useWalletsList(1, 100, undefined, {}, { field: 'currentBalance', direction: 'desc' });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.recipientId || !formData.amount) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Please fill in all required fields',
                icon: 'error',
            });
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Please enter a valid amount',
                icon: 'error',
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Create Payout',
            text: `Are you sure you want to create a payout of ₦${amount.toLocaleString()}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, create payout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#EF4444',
        });

        if (result.isConfirmed) {
            try {
                await createPayoutMutation.mutateAsync({
                    recipientId: formData.recipientId,
                    recipientType: formData.recipientType,
                    amount: amount,
                    notes: formData.notes || undefined,
                });

                await Swal.fire({
                    title: 'Success',
                    text: 'Payout created successfully',
                    icon: 'success',
                    timer: 3000,
                });

                onClose();
            } catch (error: any) {
                await Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to create payout',
                    icon: 'error',
                });
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const availableWallets = walletsData?.data?.filter(wallet => wallet.pendingBalance > 0) || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Create New Payout</h2>
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

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Recipient Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recipient Type *
                            </label>
                            <select
                                value={formData.recipientType}
                                onChange={(e) => handleInputChange('recipientType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="VENDOR">Vendor</option>
                                <option value="RIDER">Rider</option>
                            </select>
                        </div>

                        {/* Recipient Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Recipient *
                            </label>
                            <select
                                value={formData.recipientId}
                                onChange={(e) => handleInputChange('recipientId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Choose a recipient</option>
                                {availableWallets
                                    .filter(wallet => wallet.recipientType === formData.recipientType)
                                    .map(wallet => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.recipientName} - {formatCurrency(wallet.pendingBalance)} pending
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payout Amount (₦) *
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                placeholder="Enter amount"
                                min="1"
                                step="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Add any notes for this payout..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createPayoutMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createPayoutMutation.isPending ? (
                                    <div className="flex items-center">
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </div>
                                ) : (
                                    'Create Payout'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePayoutModal;