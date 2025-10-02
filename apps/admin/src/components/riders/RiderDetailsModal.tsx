import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ridersService } from '../../services/ridersService';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaUser, 
    FaPhone, 
    FaEnvelope,
    FaBuilding,
    FaMotorcycle,
    FaCreditCard,
    FaClock,
    FaDollarSign,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner,
    FaEdit,
    FaBan,
    FaCheck
} from 'react-icons/fa';
import EditRiderModal from './EditRiderModal';

interface RiderDetailsModalProps {
    riderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function RiderDetailsModal({ riderId, isOpen, onClose, onSuccess }: RiderDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    const { hasPermission } = useAdminStore();
    const [showEditModal, setShowEditModal] = useState(false);

    const { data: rider, isLoading, error, refetch } = useQuery({
        queryKey: ['rider-details', riderId],
        queryFn: () => ridersService.getRiderDetails(riderId),
        enabled: isOpen && !!riderId
    });

    const handleSuspend = async () => {
        const result = await Swal.fire({
            title: 'Suspend Rider?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to suspend this rider?</p>
                    <p class="mb-2"><strong>Rider:</strong> ${rider?.name}</p>
                    <p class="text-yellow-600 text-sm">This will prevent the rider from taking new orders.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F59E0B',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Suspend',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await ridersService.suspendRider(riderId, 'Suspended by admin');
            
            await Swal.fire({
                icon: 'success',
                title: 'Rider Suspended',
                text: `${rider?.name} has been suspended successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Suspension Failed',
                text: error.message || 'Failed to suspend rider. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleActivate = async () => {
        const result = await Swal.fire({
            title: 'Activate Rider?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to activate this rider?</p>
                    <p class="mb-2"><strong>Rider:</strong> ${rider?.name}</p>
                    <p class="text-green-600 text-sm">This will allow the rider to take new orders.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Activate',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await ridersService.activateRider(riderId);
            
            await Swal.fire({
                icon: 'success',
                title: 'Rider Activated',
                text: `${rider?.name} has been activated successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Activation Failed',
                text: error.message || 'Failed to activate rider. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleBlock = async () => {
        const result = await Swal.fire({
            title: 'Block Rider?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to block this rider?</p>
                    <p class="mb-2"><strong>Rider:</strong> ${rider?.name}</p>
                    <p class="text-red-600 text-sm">This action cannot be undone easily!</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Block',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await ridersService.blockRider(riderId, 'Blocked by admin');
            
            await Swal.fire({
                icon: 'success',
                title: 'Rider Blocked',
                text: `${rider?.name} has been blocked successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Block Failed',
                text: error.message || 'Failed to block rider. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full mx-4">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaUser className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Rider Details
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {rider?.name || 'Loading...'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'details'
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'actions'
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Actions
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-4 pb-4 sm:p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <FaSpinner className="w-6 h-6 animate-spin text-primary-600 mr-2" />
                                <span className="text-gray-600">Loading rider details...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <p className="text-red-600">Failed to load rider details</p>
                            </div>
                        ) : rider ? (
                            <>
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <FaUser className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">{rider.name}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaPhone className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">{rider.phone}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaEnvelope className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">{rider.email}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaBuilding className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">{rider.company?.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Vehicle & Status</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <FaMotorcycle className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">{rider.vehicleType}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaCheckCircle className={`w-4 h-4 mr-3 ${rider.isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                                                        <span className="text-sm text-gray-600">
                                                            {rider.isOnline ? 'Online' : 'Offline'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaClock className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-600">
                                                            {rider.currentOrderId ? 'On Delivery' : 'Available'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Earnings Summary */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-3">Earnings Summary</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center mb-2">
                                                        <FaDollarSign className="w-5 h-5 text-green-500 mr-2" />
                                                        <span className="text-2xl font-bold text-gray-900">
                                                            ₦{rider.earningsTotal?.toLocaleString() || '0'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Total Earnings</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {rider.completedOrders || 0}
                                                    </span>
                                                    <p className="text-sm text-gray-600">Completed Orders</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {rider.cancelledOrders || 0}
                                                    </span>
                                                    <p className="text-sm text-gray-600">Cancelled Orders</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bank Account */}
                                        {rider.bankAccount && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Bank Account</h4>
                                                <div className="flex items-center">
                                                    <FaCreditCard className="w-4 h-4 text-gray-400 mr-3" />
                                                    <span className="text-sm text-gray-600">{rider.bankAccount}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'actions' && (
                                    <div className="space-y-4">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-medium text-yellow-800">Rider Management Actions</h4>
                                                    <p className="text-sm text-yellow-700 mt-1">
                                                        Use these actions to manage the rider's status and availability.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Suspend/Activate */}
                                            {rider.status === 'ACTIVE' ? (
                                                <button
                                                    onClick={handleSuspend}
                                                    disabled={!hasPermission('riders.write')}
                                                    className="flex items-center justify-center px-4 py-3 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <FaBan className="w-5 h-5 text-yellow-600 mr-2" />
                                                    <span className="font-medium text-yellow-700">Suspend Rider</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleActivate}
                                                    disabled={!hasPermission('riders.write')}
                                                    className="flex items-center justify-center px-4 py-3 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <FaCheck className="w-5 h-5 text-green-600 mr-2" />
                                                    <span className="font-medium text-green-700">Activate Rider</span>
                                                </button>
                                            )}

                                            {/* Block */}
                                            <button
                                                onClick={handleBlock}
                                                disabled={!hasPermission('riders.write')}
                                                className="flex items-center justify-center px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FaBan className="w-5 h-5 text-red-600 mr-2" />
                                                <span className="font-medium text-red-700">Block Rider</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            disabled={!hasPermission('riders.write')}
                                            className="flex items-center justify-center px-4 py-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaEdit className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="font-medium text-blue-700">Edit Rider</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
            {showEditModal && (
                <EditRiderModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    rider={rider || null}
                    onSuccess={() => {
                        refetch();
                        setShowEditModal(false);
                    }}
                />
            )}
        </div>
    );
}
