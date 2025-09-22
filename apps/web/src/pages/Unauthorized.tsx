import { Link } from 'react-router-dom'
import { FaExclamationTriangle, FaSignOutAlt } from 'react-icons/fa'
import { useAuthStore } from '../stores/authStore'

export default function Unauthorized() {
    const logout = useAuthStore(state => state.logout)

    const handleLogout = async () => {
        try {
            await logout('/vendor/auth/login')
        } catch (error) {
            console.error('Logout failed:', error)
            // Force redirect even if logout fails
            window.location.href = '/vendor/auth/login'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary-300/30 to-transparent rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl mb-6 shadow-lg">
                        <FaExclamationTriangle className="w-12 h-12 text-white" />
                    </div>
                    
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">
                        403
                    </h1>
                    
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                        Access Denied
                    </h2>
                    
                    <p className="text-gray-600 mb-8">
                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="space-y-4">
                        <button
                            onClick={handleLogout}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                            <FaSignOutAlt className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Need help?{' '}
                            <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
