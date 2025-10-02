import { Link } from 'react-router-dom'
import { FaShieldAlt, FaArrowLeft } from 'react-icons/fa'

export default function AdminUnauthorized() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaShieldAlt className="w-8 h-8 text-red-600" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </p>
                    
                    <div className="space-y-3">
                        <Link
                            to="/admin/dashboard"
                            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center justify-center"
                        >
                            <FaArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                        
                        <Link
                            to="/admin/auth/login"
                            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors inline-block"
                        >
                            Switch Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}