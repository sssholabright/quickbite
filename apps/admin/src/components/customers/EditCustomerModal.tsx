import React, { useState, useEffect } from 'react';
import { useUpdateCustomer } from '../../hooks/useCustomers';
import { CustomerDetails, UpdateCustomerRequest } from '../../types/customers';
import Swal from 'sweetalert2';

interface EditCustomerModalProps {
    customer: CustomerDetails;
    onClose: () => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ customer, onClose }) => {
    const [formData, setFormData] = useState<UpdateCustomerRequest>({});
    const updateCustomer = useUpdateCustomer();

    useEffect(() => {
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            status: customer.status,
        });
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { isConfirmed } = await Swal.fire({
            title: 'Update Customer',
            text: 'Are you sure you want to update this customer\'s information?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Update Customer',
            confirmButtonColor: '#3b82f6',
            cancelButtonText: 'Cancel',
        });

        if (isConfirmed) {
            try {
                await updateCustomer.mutateAsync({
                    customerId: customer.id,
                    request: formData,
                });
                Swal.fire('Success', 'Customer updated successfully', 'success');
                onClose();
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to update customer', 'error');
            }
        }
    };

    const handleInputChange = (field: keyof UpdateCustomerRequest, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Customer</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status || ''}
                            onChange={(e) => handleInputChange('status', e.target.value || 'ACTIVE')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="VERIFICATION_PENDING">Verification Pending</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updateCustomer.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {updateCustomer.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Customer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCustomerModal;
