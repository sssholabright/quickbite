import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminStore } from '../stores/adminStore'

interface AuthRedirectProps {
    children: ReactNode
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
    const { user: adminUser, isLoading: adminLoading } = useAdminStore()
    const location = useLocation()

    const isLoading = adminLoading

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // If user is authenticated, redirect them to their dashboard
    if (adminUser) {
        return <Navigate to="/admin/dashboard" state={{ from: location }} replace />
    }

    // If not authenticated, show the auth page
    return <>{children}</>
}