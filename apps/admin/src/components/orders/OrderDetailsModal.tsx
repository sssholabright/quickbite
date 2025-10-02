import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../../services/ordersService';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaUser, 
    FaStore, 
    FaMotorcycle, 
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaClock,
    FaDollarSign,
    FaEdit,
    FaTrash,
    FaUndo,
    FaSpinner
} from 'react-icons/fa';
import ReassignRiderModal from './ReassignRiderModal';
import RefundOrderModal from './RefundOrderModal';
import CancelOrderModal from './CancelOrderModal';

interface OrderDetailsModalProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
    const { hasPermission } = useAdminStore();
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);

    // Fetch order details
    const { data: order, isLoading, error, refetch } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => ordersService.getOrderDetails(orderId),
        enabled: isOpen && !!orderId,
        staleTime: 30 * 1000,
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        const colors = {
            PENDING: 'text-yellow-600 bg-yellow-100',
            CONFIRMED: 'text-blue-600 bg-blue-100',
            PREPARING: 'text-purple-600 bg-purple-100',
            READY_FOR_PICKUP: 'text-orange-600 bg-orange-100',
            ASSIGNED: 'text-indigo-600 bg-indigo-100',
            PICKED_UP: 'text-cyan-600 bg-cyan-100',
            OUT_FOR_DELIVERY: 'text-teal-600 bg-teal-100',
            DELIVERED: 'text-green-600 bg-green-100',
            CANCELLED: 'text-red-600 bg-red-100',
        };
        return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
    };

    const handleActionSuccess = async () => {
        await Swal.fire({
            icon: 'success',
            title: 'Action Completed',
            text: 'The action has been completed successfully.',
            confirmButtonColor: '#059669'
        });
        refetch();
    };

    const handleClose = async () => {
        if (showReassignModal || showCancelModal || showRefundModal) {
            const result = await Swal.fire({
                title: 'Close Modal?',
                text: 'You have unsaved changes. Are you sure you want to close?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, Close',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) return;
        }
        
        setShowReassignModal(false);
        setShowCancelModal(false);
        setShowRefundModal(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    {/* Background overlay */}
                    <div 
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={handleClose}
                    ></div>

                    {/* Modal panel */}
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full mx-4">
                        {/* Header */}
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="text-lg sm:text-xl leading-6 font-medium text-gray-900">
                                        Order Details
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Order #{order?.orderNumber || '...'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimes className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {/* Tabs */}
                            <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'details'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="hidden sm:inline">Order Details</span>
                                    <span className="sm:hidden">Details</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'actions'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Actions
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-96 sm:max-h-none overflow-y-auto">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">Loading order details...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                                    <p className="text-red-600">Failed to load order details</p>
                                    <button
                                        onClick={() => refetch()}
                                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : order ? (
                                <>
                                    {activeTab === 'details' ? (
                                        <div className="space-y-4 sm:space-y-6">
                                            {/* Order Status - Mobile First */}
                                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900">Order Status</h4>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.status)}`}>
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-sm text-gray-500">Total Amount</p>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(order.total)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Information */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                    <FaUser className="w-4 h-4 mr-2" />
                                                    Customer Information
                                                </h4>
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Name</p>
                                                            <p className="text-sm text-gray-900">{order.customer.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Phone</p>
                                                            <p className="text-sm text-gray-900 flex items-center">
                                                                <FaPhone className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                {order.customer.phone}
                                                            </p>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                                            <p className="text-sm text-gray-900 flex items-center">
                                                                <FaEnvelope className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                {order.customer.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vendor Information */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                    <FaStore className="w-4 h-4 mr-2" />
                                                    Vendor Information
                                                </h4>
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Business Name</p>
                                                            <p className="text-sm text-gray-900">{order.vendor.businessName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Contact Person</p>
                                                            <p className="text-sm text-gray-900">{order.vendor.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Phone</p>
                                                            <p className="text-sm text-gray-900 flex items-center">
                                                                <FaPhone className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                {order.vendor.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rider Information */}
                                            {order.rider && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                        <FaMotorcycle className="w-4 h-4 mr-2" />
                                                        Rider Information
                                                    </h4>
                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">Name</p>
                                                                <p className="text-sm text-gray-900">{order.rider.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">Vehicle Type</p>
                                                                <p className="text-sm text-gray-900">{order.rider.vehicleType}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">Phone</p>
                                                                <p className="text-sm text-gray-900 flex items-center">
                                                                    <FaPhone className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                    {order.rider.phone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery Address */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                    <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                                                    Delivery Address
                                                </h4>
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                    <p className="text-sm text-gray-900">
                                                        {order.deliveryAddress?.address || 'Address not available'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Timeline */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                    <FaClock className="w-4 h-4 mr-2" />
                                                    Order Timeline
                                                </h4>
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                            <span className="text-sm text-gray-700">Order Created</span>
                                                            <span className="text-sm text-gray-900">{formatDateTime(order.createdAt)}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                            <span className="text-sm text-gray-700">Last Updated</span>
                                                            <span className="text-sm text-gray-900">{formatDateTime(order.updatedAt)}</span>
                                                        </div>
                                                        {order.estimatedDeliveryTime && (
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                                <span className="text-sm text-gray-700">Estimated Delivery</span>
                                                                <span className="text-sm text-gray-900">{formatDateTime(order.estimatedDeliveryTime)}</span>
                                                            </div>
                                                        )}
                                                        {order.cancelledAt && (
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                                <span className="text-sm text-gray-700">Cancelled At</span>
                                                                <span className="text-sm text-gray-900">{formatDateTime(order.cancelledAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-medium text-gray-900">Order Actions</h4>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Reassign Rider */}
                                                {hasPermission('orders.write') && (
                                                    <button 
                                                        onClick={() => setShowReassignModal(true)}
                                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <FaEdit className="w-6 h-6 text-blue-600 mb-2" />
                                                        <h5 className="font-medium text-gray-900">Reassign Rider</h5>
                                                        <p className="text-sm text-gray-500">Change the assigned rider for this order</p>
                                                    </button>
                                                )}

                                                {/* Cancel Order */}
                                                {hasPermission('orders.write') && (
                                                    <button 
                                                        onClick={() => setShowCancelModal(true)}
                                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <FaTimes className="w-6 h-6 text-red-600 mb-2" />
                                                        <h5 className="font-medium text-gray-900">Cancel Order</h5>
                                                        <p className="text-sm text-gray-500">Cancel this order with a reason</p>
                                                    </button>
                                                )}

                                                {/* Refund Order */}
                                                {hasPermission('orders.refund') && (
                                                    <button 
                                                        onClick={() => setShowRefundModal(true)}
                                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <FaUndo className="w-6 h-6 text-green-600 mb-2" />
                                                        <h5 className="font-medium text-gray-900">Process Refund</h5>
                                                        <p className="text-sm text-gray-500">Refund all or part of the order amount</p>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <ReassignRiderModal
                isOpen={showReassignModal}
                onClose={() => setShowReassignModal(false)}
                orderId={orderId}
                currentRider={order?.rider}
                onSuccess={handleActionSuccess}
            />

            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                orderId={orderId}
                orderNumber={order?.orderNumber || ''}
                orderTotal={order?.total || 0}
                onSuccess={handleActionSuccess}
            />

            <RefundOrderModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                orderId={orderId}
                orderNumber={order?.orderNumber || ''}
                orderTotal={order?.total || 0}
                onSuccess={handleActionSuccess}
            />
        </>
    );
}
