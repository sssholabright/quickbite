import { useEffect } from 'react'
import { useVendorStore } from '../../stores/vendorStore'
import VendorLayout from '../../components/layout/VendorLayout'
import ProfileInfo from '../../components/profile/ProfileInfo'
import AddressInfo from '../../components/profile/AddressInfo'
import BankDetails from '../../components/profile/BankDetails'
import { FaUser, FaSpinner } from 'react-icons/fa'

export default function ProfilePage() {
    const { profile, isLoading, error, fetchProfile } = useVendorStore()

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    if (isLoading) {
        return (
            <VendorLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </VendorLayout>
        )
    }

    if (error) {
        return (
            <VendorLayout>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-600">{error}</p>
                </div>
            </VendorLayout>
        )
    }

    if (!profile) {
        return (
            <VendorLayout>
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUser className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No profile found</h3>
                    <p className="text-gray-600">Unable to load your profile information.</p>
                </div>
            </VendorLayout>
        )
    }

    return (
        <VendorLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <p className="mt-2 text-gray-600">Manage your restaurant profile and business information</p>
                </div>

                {/* Profile Information */}
                <ProfileInfo profile={profile} />

                {/* Restaurant Address */}
                <AddressInfo profile={profile} />

                {/* Bank Details */}
                <BankDetails profile={profile} />
            </div>
        </VendorLayout>
    )
}