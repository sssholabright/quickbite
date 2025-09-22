import { useState } from 'react'
import { VendorProfile } from '../../types/vendor'
import { useVendorStore } from '../../stores/vendorStore'
import { showSuccess, showError } from '../../utils/sweetAlert'
import { FaEdit, FaSave, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'

interface AddressInfoProps {
    profile: VendorProfile
}

export default function AddressInfo({ profile }: AddressInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { updateProfile } = useVendorStore()
    
    const [formData, setFormData] = useState({
        street: profile.address.street,
        city: profile.address.city,
        state: profile.address.state,
        country: profile.address.country,
        postalCode: profile.address.postalCode
    })

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await updateProfile({
                address: {
                    ...profile.address,
                    ...formData
                }
            })
            setIsEditing(false)
            showSuccess('Address Updated', 'Your restaurant address has been updated successfully')
        } catch (error) {
            console.error('Failed to update address:', error)
            showError('Error', 'Failed to update address. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            street: profile.address.street,
            city: profile.address.city,
            state: profile.address.state,
            country: profile.address.country,
            postalCode: profile.address.postalCode
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
                            Save
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
                                <div>
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
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-900 font-medium">{profile.address.street}</p>
                                <p className="text-gray-600">
                                    {profile.address.city}, {profile.address.state} {profile.address.postalCode}
                                </p>
                                <p className="text-gray-600">{profile.address.country}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}