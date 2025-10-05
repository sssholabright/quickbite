import React, { useState } from 'react';
import { useCustomerDetails, useSuspendCustomer, useBlockCustomer, useActivateCustomer } from '../../hooks/useCustomers';
import Swal from 'sweetalert2';
import { useAdminStore } from '../../stores/adminStore';
import EditCustomerModal from './EditCustomerModal';

interface CustomerDetailsModalProps {
    customerId: string;
    onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customerId, onClose }) => {
    const { user } = useAdminStore();
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    const [showEditModal, setShowEditModal] = useState(false);

    const { data: customer, isLoading, error } = useCustomerDetails(customerId);
    const suspendCustomer = useSuspendCustomer();
    const blockCustomer = useBlockCustomer();
    const activateCustomer = useActivateCustomer();

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

    const handleSuspend = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Suspend Customer',
            text: 'Please provide a reason for suspending this customer (optional):',
            input: 'textarea',
            inputPlaceholder: 'Enter reason...',
            inputAttributes: {
                'aria-label': 'Enter suspension reason'
            },
            showCancelButton: true,
            confirmButtonText: 'Suspend Customer',
            confirmButtonColor: '#f59e0b',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    resolve();
                });
            }
        });

        if (reason !== undefined) {
            try {
                await suspendCustomer.mutateAsync({ customerId, reason: reason || undefined });
                Swal.fire('Success', 'Customer suspended successfully', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to suspend customer', 'error');
            }
        }
    };

    const handleBlock = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Block Customer',
            text: 'This will permanently block the customer and deactivate their account. Please provide a reason:',
            input: 'textarea',
            inputPlaceholder: 'Enter reason...',
            inputAttributes: {
                'aria-label': 'Enter block reason'
            },
            showCancelButton: true,
            confirmButtonText: 'Block Customer',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please provide a reason for blocking this customer';
                }
                return new Promise((resolve) => {
                    resolve();
                });
            }
        });

        if (reason) {
            try {
                await blockCustomer.mutateAsync({ customerId, reason });
                Swal.fire('Success', 'Customer blocked successfully', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to block customer', 'error');
            }
        }
    };

    const handleActivate = async () => {
        const { isConfirmed } = await Swal.fire({
            title: 'Activate Customer',
            text: 'This will activate the customer and restore their account access.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Activate Customer',
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Cancel',
        });

        if (isConfirmed) {
            try {
                await activateCustomer.mutateAsync(customerId);
                Swal.fire('Success', 'Customer activated successfully', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to activate customer', 'error');
            }
        }
    };

    const canSuspend = user?.permissions?.includes('customers.suspend');
    const canBlock = user?.permissions?.includes('customers.block');
    const canWrite = user?.permissions?.includes('customers.write');

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading customer details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                        <p className="text-gray-600 mb-4">Failed to load customer details</p>
                        <button
                            onClick={onClose}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            {customer.avatar ? (
                                <img className="h-12 w-12 rounded-full" src={customer.avatar} alt={customer.name} />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-lg font-medium text-gray-700">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="ml-4">
                                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                                <p className="text-gray-600">{customer.email}</p>
                            </div>
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

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                                    activeTab === 'details'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Customer Details
                            </button>
                            <button
                                onClick={() => setActiveTab('actions')}
                                className={`py-4 px-6 border-b-2 font-medium text-sm ${
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
                        {activeTab === 'details' ? (
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                                        {canWrite && (
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Edit Customer
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                                            <p className="mt-1 text-sm text-gray-900">{customer.phone || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <p className="mt-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                    customer.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                                                    customer.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {customer.status.replace('_', ' ')}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    customer.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {customer.user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-gray-900">{customer.performance.totalOrders}</div>
                                            <div className="text-sm text-gray-600">Total Orders</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{customer.performance.completedOrders}</div>
                                            <div className="text-sm text-gray-600">Completed Orders</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{customer.performance.cancelledOrders}</div>
                                            <div className="text-sm text-gray-600">Cancelled Orders</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(customer.performance.totalSpent)}</div>
                                            <div className="text-sm text-gray-600">Total Spent</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(customer.performance.avgOrderValue)}</div>
                                            <div className="text-sm text-gray-600">Avg Order Value</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-indigo-600">{customer.performance.completionRate.toFixed(1)}%</div>
                                            <div className="text-sm text-gray-600">Completion Rate</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses */}
                                {customer.addresses.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Addresses</h3>
                                        <div className="space-y-3">
                                            {customer.addresses.map((address) => (
                                                <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{address.title}</h4>
                                                            <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {address.city && `${address.city}, `}
                                                                {address.state && `${address.state}, `}
                                                                {address.country}
                                                            </p>
                                                            {address.lat && address.lng && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Coordinates: {address.lat.toFixed(6)}, {address.lng.toFixed(6)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {address.isDefault && (
                                                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Orders */}
                                {customer.recentOrders.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                                        <div className="space-y-3">
                                            {customer.recentOrders.map((order) => (
                                                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                                                            <p className="text-sm text-gray-600 mt-1">{order.vendorName}</p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {formatDate(order.createdAt)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Actions</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {customer.status === 'ACTIVE' && (
                                        <>
                                            {canSuspend && (
                                                <button
                                                    onClick={handleSuspend}
                                                    disabled={suspendCustomer.isPending}
                                                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {suspendCustomer.isPending ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                                        </svg>
                                                    )}
                                                    Suspend Customer
                                                </button>
                                            )}
                                            {canBlock && (
                                                <button
                                                    onClick={handleBlock}
                                                    disabled={blockCustomer.isPending}
                                                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {blockCustomer.isPending ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                    )}
                                                    Block Customer
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {(customer.status === 'SUSPENDED' || customer.status === 'BLOCKED') && canWrite && (
                                        <button
                                            onClick={handleActivate}
                                            disabled={activateCustomer.isPending}
                                            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {activateCustomer.isPending ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            Activate Customer
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                                            <div className="mt-2 text-sm text-yellow-700">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Suspending a customer will prevent them from placing new orders</li>
                                                    <li>Blocking a customer will permanently deactivate their account</li>
                                                    <li>All actions are logged and can be reviewed in the audit trail</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Customer Modal */}
            {showEditModal && (
                <EditCustomerModal
                    customer={customer}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </>
    );
};

export default CustomerDetailsModal;