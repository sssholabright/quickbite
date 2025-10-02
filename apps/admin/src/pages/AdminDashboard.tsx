import React, { useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { 
    FaCheckCircle, 
    FaClipboardList, 
    FaClock, 
    FaDollarSign, 
    FaExclamationTriangle, 
    FaMotorcycle, 
    FaStore, 
    FaTimes, 
    FaUsers,
    FaSyncAlt 
} from 'react-icons/fa'
import { useDashboardData } from '../hooks/useDashboard'
import { useAdminStore } from '../stores/adminStore'

export default function AdminDashboard() {
    const { user, hasPermission } = useAdminStore()
    const {
        dashboardStats,
        activityFeed,
        isLoading,
        isStatsLoading,
        isActivityLoading,
        isError,
        error,
        refreshDashboard,
        isRefreshing,
        refetchStats,
        refetchActivity,
    } = useDashboardData()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    useEffect(() => {
        console.log('dashboardStats', dashboardStats)
    }, [dashboardStats])

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
        return `${Math.floor(diffInMinutes / 1440)}d ago`
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'order': return FaClipboardList
            case 'rider': return FaMotorcycle
            case 'vendor': return FaStore
            case 'customer': return FaUsers
            default: return FaExclamationTriangle
        }
    }

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'order': return 'text-blue-500'
            case 'rider': return 'text-green-500'
            case 'vendor': return 'text-purple-500'
            case 'customer': return 'text-orange-500'
            default: return 'text-gray-500'
        }
    }

    if (isError) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
                        <p className="text-gray-600 mb-4">
                            {error?.message || 'Something went wrong while loading dashboard data'}
                        </p>
                        <button
                            onClick={() => {
                                refetchStats()
                                refetchActivity()
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600">
                            Welcome back, {user?.name || 'Admin'}. Here's what's happening today.
                        </p>
                    </div>
                    <button
                        onClick={() => refreshDashboard()}
                        disabled={isRefreshing}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaSyncAlt className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="p-3 bg-gray-200 rounded-lg">
                                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                {!isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Orders Today */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Orders Today</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {isStatsLoading ? '...' : (dashboardStats?.ordersToday || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FaClipboardList className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {isStatsLoading ? '...' : (
                                            dashboardStats?.totalRevenue ? formatCurrency(dashboardStats.totalRevenue) : '₦0'
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <FaDollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Online Riders */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Online Riders</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {isStatsLoading ? '...' : (dashboardStats?.onlineRiders || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <FaMotorcycle className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Active Vendors */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {isStatsLoading ? '...' : (dashboardStats?.activeVendors || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <FaStore className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Status Summary */}
                {!isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
                                <FaClock className="w-5 h-5 text-yellow-500" />
                            </div>
                            <p className="text-3xl font-bold text-yellow-600">
                                {isStatsLoading ? '...' : (dashboardStats?.pendingOrders || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">Awaiting confirmation</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Ready for Pickup</h3>
                                <FaCheckCircle className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {isStatsLoading ? '...' : (dashboardStats?.readyForPickupOrders || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">Ready for rider pickup</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Delivered</h3>
                                <FaCheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                                {isStatsLoading ? '...' : (dashboardStats?.completedOrders || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">Successfully delivered</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Cancelled</h3>
                                <FaTimes className="w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-3xl font-bold text-red-600">
                                {isStatsLoading ? '...' : (dashboardStats?.cancelledOrders || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">Cancelled orders</p>
                        </div>
                    </div>
                )}

                {/* Live Activity Feed */}
                {hasPermission('activity.read') && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
                            <button
                                onClick={() => refetchActivity()}
                                disabled={isActivityLoading}
                                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                            >
                                {isActivityLoading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {isActivityLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                ))
                            ) : activityFeed && activityFeed.length > 0 ? (
                                activityFeed.slice(0, 10).map((activity) => {
                                    const IconComponent = getActivityIcon(activity.type)
                                    const iconColor = getActivityColor(activity.type)
                                    
                                    return (
                                        <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className={`p-2 rounded-lg ${iconColor.replace('text-', 'bg-').replace('-500', '-100')}`}>
                                                <IconComponent className={`w-4 h-4 ${iconColor}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{activity.message}</p>
                                                <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}