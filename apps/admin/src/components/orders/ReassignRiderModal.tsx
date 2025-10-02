import React, { useState } from 'react';
import { useAvailableRiders, useReassignRider } from '../../hooks/useOrders';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaUser, 
    FaMotorcycle, 
    FaPhone,
    FaCheckCircle,
    FaExclamationTriangle
} from 'react-icons/fa';

interface ReassignRiderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentRider?: {
        id: string;
        name: string;
        phone: string;
        vehicleType: string;
    };
    onSuccess?: () => void;
}

export default function ReassignRiderModal({ 
    isOpen, 
    onClose, 
    orderId, 
    currentRider,
    onSuccess 
}: ReassignRiderModalProps) {
    const { hasPermission } = useAdminStore();
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [reason, setReason] = useState('');
    
    const { data: availableRiders, isLoading: isLoadingRiders } = useAvailableRiders();
    const reassignRiderMutation = useReassignRider();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedRiderId) {
            Swal.fire({
                icon: 'warning',
                title: 'No Rider Selected',
                text: 'Please select a rider to assign to this order.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const selectedRider = availableRiders?.find(r => r.id === selectedRiderId);
        
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Reassign Rider?',
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong>Order:</strong> #${orderId}</p>
                    <p class="mb-2"><strong>New Rider:</strong> ${selectedRider?.name}</p>
                    <p class="mb-2"><strong>Vehicle:</strong> ${selectedRider?.vehicleType}</p>
                    ${reason ? `<p class="mb-2"><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reassign Rider',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await reassignRiderMutation.mutateAsync({
                orderId,
                request: {
                    newRiderId: selectedRiderId,
                    reason: reason || undefined
                }
            });
            
            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Rider Reassigned',
                text: `Order has been reassigned to ${selectedRider?.name} successfully.`,
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
            
            // Reset form
            setSelectedRiderId('');
            setReason('');
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Reassignment Failed',
                text: error.message || 'Failed to reassign rider. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        setSelectedRiderId('');
        setReason('');
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
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaMotorcycle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Reassign Rider
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Change the rider assigned to this order
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

                        {/* Current Rider Info */}
                        {currentRider && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center">
                                    <FaExclamationTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                                    <span className="text-sm font-medium text-yellow-800">Current Rider:</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">
                                    {currentRider.name} ({currentRider.vehicleType})
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pb-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Select New Rider */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select New Rider *
                                    </label>
                                    {isLoadingRiders ? (
                                        <div className="border border-gray-300 rounded-lg p-3">
                                            <div className="animate-pulse flex items-center space-x-3">
                                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : availableRiders && availableRiders.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {availableRiders.map((rider) => (
                                                <label
                                                    key={rider.id}
                                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedRiderId === rider.id
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="rider"
                                                        value={rider.id}
                                                        checked={selectedRiderId === rider.id}
                                                        onChange={(e) => setSelectedRiderId(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-center flex-1">
                                                        <div className="flex-shrink-0">
                                                            <FaUser className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div className="ml-3 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {rider.name}
                                                                </p>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        rider.isOnline 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {rider.isOnline ? 'Online' : 'Offline'}
                                                                    </span>
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        rider.isAvailable 
                                                                            ? 'bg-blue-100 text-blue-800' 
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {rider.isAvailable ? 'Available' : 'Busy'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center mt-1 space-x-4">
                                                                <p className="text-sm text-gray-500 flex items-center">
                                                                    <FaPhone className="w-3 h-3 mr-1" />
                                                                    {rider.phone}
                                                                </p>
                                                                <p className="text-sm text-gray-500 flex items-center">
                                                                    <FaMotorcycle className="w-3 h-3 mr-1" />
                                                                    {rider.vehicleType}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedRiderId === rider.id && (
                                                        <FaCheckCircle className="w-5 h-5 text-primary-600 ml-2" />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border border-gray-300 rounded-lg p-4 text-center">
                                            <p className="text-sm text-gray-500">No available riders found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Reassignment (Optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        placeholder="Enter reason for reassignment..."
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {reason.length}/500 characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={!selectedRiderId || reassignRiderMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {reassignRiderMutation.isPending ? 'Reassigning...' : 'Reassign Rider'}
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
