import { useState } from 'react'
import { VendorProfile } from '../../types/vendor'
import { useVendorStore } from '../../stores/vendorStore'
import { showConfirm, showSuccess, showError } from '../../utils/sweetAlert'
import { FaEdit, FaSave, FaTimes, FaMapMarkerAlt, FaLocationArrow, FaSpinner } from 'react-icons/fa'

interface AddressInfoProps {
    profile: VendorProfile
}

export default function AddressInfo({ profile }: AddressInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const { updateProfile } = useVendorStore()
    
    const [formData, setFormData] = useState({
        street: profile.address.street,
        city: profile.address.city,
        state: profile.address.state,
        country: profile.address.country,
        postalCode: profile.address.postalCode,
        latitude: profile.address.coordinates?.lat?.toString() || '0',
        longitude: profile.address.coordinates?.lng?.toString() || '0'
    })

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocation Error', 'Geolocation is not supported by this browser.')
            return
        }

        setIsGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                setFormData(prev => ({
                    ...prev,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                }))
                setIsGettingLocation(false)
                showSuccess('Location Found', 'Your current location has been set.')
            },
            (error) => {
                setIsGettingLocation(false)
                showError('Location Error', 'Unable to get your current location. Please enter coordinates manually.')
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        )
    }

    const handleSave = async () => {
        try {
            // Show confirmation dialog
            const confirmed = await showConfirm(
                'Save Address Changes',
                'Are you sure you want to save these address changes?',
                'Save',
                'Cancel'
            );

            if (!confirmed) {
                return; // User cancelled
            }

            setIsLoading(true);

            const updateData = {
                businessAddress: formData.street + ' ' + formData.city + ' ' + formData.state + ' ' + formData.country + ' ' + formData.postalCode + ' ' + formData.latitude + ' ' + formData.longitude,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
            };

            await updateProfile(updateData as Partial<VendorProfile>);
            
            showSuccess('Address updated successfully!');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update address:', error);
            showError('Failed to update address. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            street: profile.address.street,
            city: profile.address.city,
            state: profile.address.state,
            country: profile.address.country,
            postalCode: profile.address.postalCode,
            latitude: profile.address.coordinates?.lat?.toString() || '0',
            longitude: profile.address.coordinates?.lng?.toString() || '0'
        })
        setIsEditing(false)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Restaurant Address</h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FaEdit className="w-4 h-4 mr-2" />
                        Edit
                    </button>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleCancel}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaTimes className="w-4 h-4 mr-2" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaSave className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-start">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                
                                {/* Location Section */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Location Coordinates
                                        </label>
                                        <button
                                            type="button"
                                            onClick={getCurrentLocation}
                                            disabled={isGettingLocation}
                                            className="flex items-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isGettingLocation ? (
                                                <FaSpinner className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <FaLocationArrow className="w-3 h-3 mr-1" />
                                            )}
                                            {isGettingLocation ? 'Getting...' : 'Get Current Location'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                Latitude (Read-only)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.latitude}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                Longitude (Read-only)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.longitude}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-900 font-medium">{profile.address.street}</p>
                                <p className="text-gray-600">
                                    {profile.address.city}, {profile.address.state} {profile.address.postalCode}
                                </p>
                                <p className="text-gray-600">{profile.address.country}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Coordinates: {profile.address.coordinates?.lat || 0}, {profile.address.coordinates?.lng || 0}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}