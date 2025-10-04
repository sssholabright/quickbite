import { useState, useRef } from 'react'
import { VendorProfile } from '../../types/vendor'
import { useVendorStore } from '../../stores/vendorStore'
import { showConfirm, showSuccess, showError } from '../../utils/sweetAlert'
import { FaEdit, FaSave, FaTimes, FaUpload, FaUser, FaEnvelope, FaPhone, FaCamera } from 'react-icons/fa'

interface ProfileInfoProps {
    profile: VendorProfile
}

export default function ProfileInfo({ profile }: ProfileInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { updateProfile } = useVendorStore()
    
    const [formData, setFormData] = useState({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        description: profile.description || ''
    })

    const handleSave = async () => {
        try {
            // Show confirmation dialog
            const confirmed = await showConfirm(
                'Save Profile Changes',
                'Are you sure you want to save these profile changes?',
                'Save',
                'Cancel'
            );

            if (!confirmed) {
                return; // User cancelled
            }

            setIsLoading(true);
            await updateProfile(formData, logoFile || undefined);
            setIsEditing(false);
            setLogoFile(null);
            setLogoPreview(null);
            showSuccess('Profile Updated', 'Your profile information has been updated successfully');
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            showError('Error', error.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleCancel = () => {
        setFormData({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            description: profile.description || ''
        })
        setLogoFile(null)
        setLogoPreview(null)
        setIsEditing(false)
    }

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError('Invalid File Type', 'Please select an image file.')
                return
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File Too Large', 'Please select an image smaller than 5MB.')
                return
            }

            setLogoFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleLogoClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemoveLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Logo Section */}
                <div className="lg:col-span-1">
                    <div className="text-center">
                        <div className="relative inline-block">
                            <img
                                src={logoPreview || profile.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop'}
                                alt="Restaurant Logo"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                            {isEditing && (
                                <button 
                                    onClick={handleLogoClick}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <FaCamera className="w-4 h-4" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Restaurant Logo</p>
                        {isEditing && (
                            <div className="mt-2">
                                <button
                                    onClick={handleRemoveLogo}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Remove Logo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        {/* Restaurant Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Restaurant Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            ) : (
                                <div className="flex items-center">
                                    <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">{profile.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            ) : (
                                <div className="flex items-center">
                                    <FaEnvelope className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">{profile.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            ) : (
                                <div className="flex items-center">
                                    <FaPhone className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">{profile.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Tell customers about your restaurant..."
                                />
                            ) : (
                                <p className="text-gray-900">{profile.description || 'No description provided'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}