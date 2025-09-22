import { useState } from 'react'
import { VendorProfile } from '../../types/vendor'
import { useVendorStore } from '../../stores/vendorStore'
import { showSuccess, showError } from '../../utils/sweetAlert'
import { FaEdit, FaSave, FaTimes, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface BankDetailsProps {
    profile: VendorProfile
}

export default function BankDetails({ profile }: BankDetailsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { updateBankDetails } = useVendorStore()
    
    const [formData, setFormData] = useState({
        bankName: profile.bankDetails.bankName,
        accountNumber: profile.bankDetails.accountNumber,
        accountName: profile.bankDetails.accountName,
        bankCode: profile.bankDetails.bankCode || ''
    })

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await updateBankDetails(formData)
            setIsEditing(false)
            showSuccess('Bank Details Updated', 'Your bank details have been updated successfully')
        } catch (error) {
            console.error('Failed to update bank details:', error)
            showError('Error', 'Failed to update bank details. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            bankName: profile.bankDetails.bankName,
            accountNumber: profile.bankDetails.accountNumber,
            accountName: profile.bankDetails.accountName,
            bankCode: profile.bankDetails.bankCode || ''
        })
        setIsEditing(false)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
                    <div className="ml-3">
                        {profile.bankDetails.isVerified ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                <FaExclamationTriangle className="w-3 h-3 mr-1" />
                                Pending Verification
                            </span>
                        )}
                    </div>
                </div>
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
                    <FaCreditCard className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankCode}
                                        onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountName}
                                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Bank Name</p>
                                    <p className="text-gray-900 font-medium">{profile.bankDetails.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Account Number</p>
                                    <p className="text-gray-900 font-medium">{profile.bankDetails.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Account Name</p>
                                    <p className="text-gray-900 font-medium">{profile.bankDetails.accountName}</p>
                                </div>
                                {profile.bankDetails.bankCode && (
                                    <div>
                                        <p className="text-sm text-gray-600">Bank Code</p>
                                        <p className="text-gray-900 font-medium">{profile.bankDetails.bankCode}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}