import React, { useState, useEffect, useRef } from 'react';
import { useVendorDetails, useUpdateVendor } from '../../hooks/useVendors';
import { UpdateVendorRequest } from '../../types/vendors';
import Swal from 'sweetalert2';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaCamera, FaImage, FaLocationArrow, FaSpinner } from 'react-icons/fa';

interface EditVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    onSuccess?: () => void;
}

export default function EditVendorModal({ isOpen, onClose, vendorId, onSuccess }: EditVendorModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        businessAddress: '',
        latitude: '',
        longitude: '',
        description: '',
        openingTime: '',
        closingTime: '',
        operatingDays: [] as string[],
        status: 'PENDING' as 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED'
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: vendor, isLoading } = useVendorDetails(vendorId);
    const updateVendorMutation = useUpdateVendor();

    const operatingDaysOptions = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        if (vendor) {
            setFormData({
                name: vendor.user.name,
                email: vendor.email,
                phone: vendor.phone,
                businessName: vendor.businessName,
                businessAddress: vendor.location.address || '',
                latitude: vendor.location.latitude?.toString() || '',
                longitude: vendor.location.longitude?.toString() || '',
                description: vendor.description || '',
                openingTime: vendor.operationalHours.openingTime || '',
                closingTime: vendor.operationalHours.closingTime || '',
                operatingDays: vendor.operationalHours.operatingDays,
                status: vendor.status
            });
            
            // Set logo preview if vendor has a logo
            if (vendor.logo) {
                setLogoPreview(vendor.logo);
            }
        }
    }, [vendor]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File Type',
                    text: 'Please select an image file.',
                    confirmButtonColor: '#DC2626'
                });
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'File Too Large',
                    text: 'Please select an image smaller than 5MB.',
                    confirmButtonColor: '#DC2626'
                });
                return;
            }

            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!vendor) return;

        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.businessName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields.',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Update Vendor?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to update this vendor?</p>
                    <p class="mb-2"><strong>Name:</strong> ${formData.name}</p>
                    <p class="mb-2"><strong>Business:</strong> ${formData.businessName}</p>
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
            const request: UpdateVendorRequest = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                businessName: formData.businessName.trim(),
                businessAddress: formData.businessAddress.trim() || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                description: formData.description.trim() || undefined,
                openingTime: formData.openingTime || undefined,
                closingTime: formData.closingTime || undefined,
                operatingDays: formData.operatingDays.length > 0 ? formData.operatingDays : undefined,
                status: formData.status
            };

            await updateVendorMutation.mutateAsync({
                vendorId: vendor.id,
                request,
                logoFile: logoFile || undefined
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Vendor Updated',
                text: 'Vendor information has been updated successfully.',
                confirmButtonColor: '#059669'
            });
            
            onSuccess?.();
            onClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Failed to update vendor. Please try again.',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleClose = () => {
        if (vendor) {
            setFormData({
                name: vendor.user.name,
                email: vendor.email,
                phone: vendor.phone,
                businessName: vendor.businessName,
                businessAddress: vendor.location.address || '',
                latitude: vendor.location.latitude?.toString() || '',
                longitude: vendor.location.longitude?.toString() || '',
                description: vendor.description || '',
                openingTime: vendor.operationalHours.openingTime || '',
                closingTime: vendor.operationalHours.closingTime || '',
                operatingDays: vendor.operationalHours.operatingDays,
                status: vendor.status
            });
            
            // Reset logo state
            setLogoFile(null);
            if (vendor.logo) {
                setLogoPreview(vendor.logo);
            } else {
                setLogoPreview(null);
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
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

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire({
                icon: 'error',
                title: 'Geolocation Not Supported',
                text: 'Your browser does not support geolocation.',
                confirmButtonColor: '#DC2626'
            });
            return;
        }

        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString()
                }));
                setIsGettingLocation(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Location Retrieved',
                    text: 'Current location has been set successfully.',
                    confirmButtonColor: '#059669'
                });
            },
            (error) => {
                setIsGettingLocation(false);
                let errorMessage = 'Failed to get current location.';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Location Error',
                    text: errorMessage,
                    confirmButtonColor: '#DC2626'
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    if (!isOpen || !vendor) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="bg-white rounded-lg p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-600">Loading vendor details...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                                        Edit Vendor
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Update vendor information
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
                                {/* Logo Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaImage className="w-3 h-3 inline mr-1" />
                                        Business Logo
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {logoPreview ? (
                                                <img
                                                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                                    <FaImage className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={handleLogoClick}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                                >
                                                    <FaCamera className="w-4 h-4 mr-1" />
                                                    {logoFile ? 'Change Logo' : 'Update Logo'}
                                                </button>
                                                {(logoFile || logoPreview) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                PNG, JPG, WEBP up to 5MB
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </div>

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
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Location Coordinates
                                        </label>
                                        <button
                                            type="button"
                                            onClick={getCurrentLocation}
                                            disabled={isGettingLocation}
                                            className="inline-flex items-center px-3 py-1 text-xs border border-primary-300 shadow-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                        >
                                            {isGettingLocation ? (
                                                <FaSpinner className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <FaLocationArrow className="w-3 h-3 mr-1" />
                                            )}
                                            {isGettingLocation ? 'Getting...' : 'Get Current Location'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
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
                                            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.longitude}
                                                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                                placeholder="3.3792"
                                            />
                                        </div>
                                    </div>
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

                                {/* Status */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="SUSPENDED">Suspended</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={updateVendorMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {updateVendorMutation.isPending ? 'Updating...' : 'Update Vendor'}
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
