import { useState } from 'react'
import { VendorProfile, ChangePasswordData } from '../../types/vendor'
import { useVendorStore } from '../../stores/vendorStore'
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert'
import { FaEdit, FaSave, FaTimes, FaBell, FaLock, FaToggleOn, FaToggleOff } from 'react-icons/fa'

interface AccountSettingsProps {
    profile: VendorProfile
}

export default function AccountSettings({ profile }: AccountSettingsProps) {
    const [activeTab, setActiveTab] = useState<'notifications' | 'password'>('notifications')
    const [isLoading, setIsLoading] = useState(false)
    const { updateSettings, changePassword } = useVendorStore()
    
    const [passwordData, setPasswordData] = useState<ChangePasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [notificationSettings, setNotificationSettings] = useState(profile.settings.notifications)

    const handleNotificationChange = async (key: keyof typeof notificationSettings) => {
        const newSettings = {
            ...notificationSettings,
            [key]: !notificationSettings[key]
        }
        setNotificationSettings(newSettings)
        
        try {
            await updateSettings({
                notifications: newSettings
            })
            showSuccess('Settings Updated', 'Your notification preferences have been updated')
        } catch (error) {
            console.error('Failed to update notifications:', error)
            showError('Error', 'Failed to update notification settings')
            // Revert the change
            setNotificationSettings(profile.settings.notifications)
        }
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError('Error', 'New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 8) {
            showError('Error', 'Password must be at least 8 characters long')
            return
        }

        const result = await showConfirm(
            'Change Password',
            'Are you sure you want to change your password?',
            'Yes, change password',
            'Cancel'
        )

        if (result.isConfirmed) {
            setIsLoading(true)
            try {
                await changePassword(passwordData)
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                showSuccess('Password Changed', 'Your password has been changed successfully')
            } catch (error) {
                console.error('Failed to change password:', error)
                showError('Error', 'Failed to change password. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'notifications'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaBell className="w-4 h-4 inline mr-2" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'password'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaLock className="w-4 h-4 inline mr-2" />
                        Change Password
                    </button>
                </nav>
            </div>

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-600">Receive notifications via email</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('email')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.email ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.email ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('sms')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.sms ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.sms ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('push')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.push ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.push ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Order Updates</p>
                                <p className="text-sm text-gray-600">Get notified about new orders and status changes</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('orderUpdates')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.orderUpdates ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Payment Updates</p>
                                <p className="text-sm text-gray-600">Get notified about payment confirmations</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('paymentUpdates')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.paymentUpdates ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.paymentUpdates ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Marketing</p>
                                <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('marketing')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings.marketing ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notificationSettings.marketing ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={handlePasswordChange}
                            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaLock className="w-4 h-4 mr-2" />
                            Change Password
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}