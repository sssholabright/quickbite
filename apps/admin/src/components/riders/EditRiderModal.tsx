import React, { useState, useEffect } from 'react';
import { useUpdateRider, useAvailableCompanies } from '../../hooks/useRiders';
import { RiderDetails } from '../../types/logistics';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaUser,
    FaPhone,
    FaEnvelope,
    FaMotorcycle,
    FaBuilding,
    FaCreditCard
} from 'react-icons/fa';

interface EditRiderModalProps {
    isOpen: boolean;
    onClose: () => void;
    rider: RiderDetails | null;
    onSuccess?: () => void;
}

export default function EditRiderModal({ isOpen, onClose, rider, onSuccess }: EditRiderModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        companyId: '',
        vehicleType: 'BIKE' as 'BIKE' | 'CAR' | 'MOTORCYCLE',
        bankAccount: '',
        status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
    });

    const updateRiderMutation = useUpdateRider();
    const { data: companies } = useAvailableCompanies();

    useEffect(() => {
        if (rider) {
            setFormData({
                name: rider.name,
                phone: rider.phone,
                email: rider.email,
                companyId: rider.company?.id || '',
                vehicleType: rider.vehicleType,
                bankAccount: rider.bankAccount || '',
                status: rider.status
            });
        }
    }, [rider]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!rider) return;

        if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.companyId.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Update Rider?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to update this rider?</p>
                    <p class="mb-2"><strong>Rider:</strong> ${formData.name}</p>
                    <p class="mb-2"><strong>Company:</strong> ${companies?.find(c => c.id === formData.companyId)?.name}</p>
                    <p class="mb-2"><strong>Status:</strong> ${formData.status}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Update',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await updateRiderMutation.mutateAsync({
                riderId: rider.id,
                request: {
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    email: formData.email.trim(),
                    vehicleType: formData.vehicleType,
                    bankAccount: formData.bankAccount.trim() || undefined,
                    status: formData.status
                }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Rider Updated',
                text: 'Rider information has been updated successfully.',
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Failed to update rider. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        if (rider) {
            setFormData({
                name: rider.name,
                phone: rider.phone,
                email: rider.email,
                companyId: rider.company?.id || '',
                vehicleType: rider.vehicleType,
                bankAccount: rider.bankAccount || '',
                status: rider.status
            });
        }
        onClose();
    };

    if (!isOpen || !rider) return null;

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
                                    <FaUser className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Edit Rider
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Update rider information
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
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pb-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaPhone className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="+2348012345678"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaEnvelope className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="rider@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaBuilding className="w-3 h-3 inline mr-1" />
                                        Company *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {companies?.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Vehicle Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaMotorcycle className="w-3 h-3 inline mr-1" />
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value as 'BIKE' | 'CAR' | 'MOTORCYCLE' }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    >
                                        <option value="BIKE">Bike</option>
                                        <option value="MOTORCYCLE">Motorcycle</option>
                                        <option value="CAR">Car</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="SUSPENDED">Suspended</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>

                                {/* Bank Account */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaCreditCard className="w-3 h-3 inline mr-1" />
                                        Bank Account (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankAccount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="Account number or details"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={updateRiderMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {updateRiderMutation.isPending ? 'Updating...' : 'Update Rider'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
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