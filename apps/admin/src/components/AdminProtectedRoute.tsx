import { useAdminStore } from '../stores/adminStore'
import { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface AdminProtectedRouteProps {
    children: ReactNode
    requiredPermission?: string
    requiredPermissions?: string[]
    requireAll?: boolean // If true, requires ALL permissions; if false, requires ANY permission
}

export default function AdminProtectedRoute({ 
    children, 
    requiredPermission, 
    requiredPermissions,
    requireAll = true 
}: AdminProtectedRouteProps) {
    const { user, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } = useAdminStore()
    const location = useLocation()
    const navigate = useNavigate()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return navigate("/admin/auth/login", { state: { from: location } })
    }

    // Check single permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return navigate("/admin/unauthorized", { replace: true })
    }

    // Check multiple permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermissions = requireAll 
            ? hasAllPermissions(requiredPermissions)
            : hasAnyPermission(requiredPermissions)

        if (!hasRequiredPermissions) {
            return navigate("/admin/unauthorized", { replace: true })
        }
    }

    return <>{children}</>
}