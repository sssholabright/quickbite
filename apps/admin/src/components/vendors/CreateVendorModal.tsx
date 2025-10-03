import React, { useState } from 'react';
import { useCreateVendor } from '../../hooks/useVendors';
import { CreateVendorRequest } from '../../types/vendors';
import Swal from 'sweetalert2';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

interface CreateVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateVendorModal({ isOpen, onClose, onSuccess }: CreateVendorModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        businessName: '',
        businessAddress: '',
        latitude: '',
        longitude: '',
        description: '',
        openingTime: '',
        closingTime: '',
        operatingDays: [] as string[]
    });

    const [showPassword, setShowPassword] = useState(false);

    const createVendorMutation = useCreateVendor();

    const operatingDaysOptions = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || 
            !formData.password.trim() || !formData.businessName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        if (formData.password.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Weak Password',
                text: 'Password must be at least 6 characters long.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Create Vendor?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to create this vendor?</p>
                    <p class="mb-2"><strong>Name:</strong> ${formData.name}</p>
                    <p class="mb-2"><strong>Business:</strong> ${formData.businessName}</p>
                    <p class="mb-2"><strong>Email:</strong> ${formData.email}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Create',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const request: CreateVendorRequest = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                businessName: formData.businessName.trim(),
                businessAddress: formData.businessAddress.trim() || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                description: formData.description.trim() || undefined,
                openingTime: formData.openingTime || undefined,
                closingTime: formData.closingTime || undefined,
                operatingDays: formData.operatingDays.length > 0 ? formData.operatingDays : undefined
            };

            await createVendorMutation.mutateAsync(request);
            
            await Swal.fire({
                icon: 'success',
                title: 'Vendor Created',
                text: 'Vendor has been created successfully and is pending approval.',
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: error.message || 'Failed to create vendor. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            businessName: '',
            businessAddress: '',
            latitude: '',
            longitude: '',
            description: '',
            openingTime: '',
            closingTime: '',
            operatingDays: []
        });
        setShowPassword(false);
        onClose();
    };

    const handleOperatingDayToggle = (day: string) => {
        setFormData(prev => ({
            ...prev,
            operatingDays: prev.operatingDays.includes(day)
                ? prev.operatingDays.filter(d => d !== day)
                : [...prev.operatingDays, day]
        }));
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
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full mx-4">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaBuilding className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Create New Vendor
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Add a new vendor to the platform
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
                        <div className="bg-white px-4 pb-4 sm:p-6 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaUser className="w-3 h-3 inline mr-1" />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaEnvelope className="w-3 h-3 inline mr-1" />
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="vendor@example.com"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaPhone className="w-3 h-3 inline mr-1" />
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="+2348012345678"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="Enter password (min 6 characters)"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <FaEyeSlash className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <FaEye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Business Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaBuilding className="w-3 h-3 inline mr-1" />
                                        Business Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="Enter business name"
                                        required
                                    />
                                </div>

                                {/* Business Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaMapMarkerAlt className="w-3 h-3 inline mr-1" />
                                        Business Address
                                    </label>
                                    <textarea
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="Enter business address"
                                        rows={2}
                                    />
                                </div>

                                {/* Coordinates */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="6.5244"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="3.3792"
                                    />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        placeholder="Brief description of the business"
                                        rows={3}
                                    />
                                </div>

                                {/* Operating Hours */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaClock className="w-3 h-3 inline mr-1" />
                                        Opening Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.openingTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaClock className="w-3 h-3 inline mr-1" />
                                        Closing Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.closingTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Operating Days */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaCalendarAlt className="w-3 h-3 inline mr-1" />
                                        Operating Days
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {operatingDaysOptions.map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleOperatingDayToggle(day)}
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    formData.operatingDays.includes(day)
                                                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                                                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={createVendorMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {createVendorMutation.isPending ? 'Creating...' : 'Create Vendor'}
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
