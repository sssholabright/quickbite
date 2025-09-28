import { FaClipboardList, FaUtensils, FaDollarSign, FaClock, FaCheckCircle, FaTimes, FaExclamationTriangle, FaMotorcycle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/layout/VendorLayout'
import { useOrderStats, useOrders } from '../../hooks/useOrders'
import { useRealtimeStore } from '../../stores/realtimeStore'
import { formatNaira } from '../../lib/mockOrders'

export default function VendorDashboard() {
    const { data: orderStats, isLoading: statsLoading } = useOrderStats()
    const { connectionStatus } = useRealtimeStore()
    
    // Get recent orders (last 5 orders)
    const { data: recentOrdersData, isLoading: ordersLoading } = useOrders({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
    })
    
    const recentOrders = recentOrdersData?.orders || []

    // Calculate today's revenue from recent orders (mock for now)
    const todayRevenue = recentOrders
        .filter(order => {
            const orderDate = new Date(order.createdAt)
            const today = new Date()
            return orderDate.toDateString() === today.toDateString()
        })
        .reduce((total, order) => total + order.total, 0)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500'
            case 'CONFIRMED': return 'bg-blue-500'
            case 'PREPARING': return 'bg-blue-500'
            case 'READY_FOR_PICKUP': return 'bg-green-500'
            case 'ASSIGNED': return 'bg-purple-500'
            case 'PICKED_UP': return 'bg-purple-500'
            case 'OUT_FOR_DELIVERY': return 'bg-purple-500'
            case 'DELIVERED': return 'bg-green-500'
            case 'CANCELLED': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending'
            case 'CONFIRMED': return 'Confirmed'
            case 'PREPARING': return 'Preparing'
            case 'READY_FOR_PICKUP': return 'Ready'
            case 'ASSIGNED': return 'Assigned'
            case 'PICKED_UP': return 'Picked Up'
            case 'OUT_FOR_DELIVERY': return 'Out for Delivery'
            case 'DELIVERED': return 'Delivered'
            case 'CANCELLED': return 'Cancelled'
            default: return status
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const orderTime = new Date(timestamp)
        const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }

    return (
        <VendorLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your restaurant today.</p>
                    </div>
                    
                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600">
                            {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Pending Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <FaClock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {statsLoading ? '...' : orderStats?.pending || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preparing Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaUtensils className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Preparing</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {statsLoading ? '...' : orderStats?.preparing || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ready Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FaCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Ready for Pickup</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {statsLoading ? '...' : orderStats?.ready || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Today's Revenue */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <FaDollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatNaira(todayRevenue)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link 
                            to="/vendor/orders"
                            className="flex items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                                <FaClipboardList className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4 text-left">
                                <h3 className="text-lg font-semibold text-blue-900">View Orders</h3>
                                <p className="text-sm text-blue-700">Manage incoming and active orders</p>
                            </div>
                        </Link>

                        <Link 
                            to="/vendor/menu"
                            className="flex items-center p-6 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                                <FaUtensils className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4 text-left">
                                <h3 className="text-lg font-semibold text-green-900">Update Menu</h3>
                                <p className="text-sm text-green-700">Add, edit, or remove menu items</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                        <Link 
                            to="/vendor/orders"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All
                        </Link>
                    </div>
                    
                    {ordersLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="ml-2 text-gray-600">Loading orders...</span>
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="text-center py-8">
                            <FaClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No recent orders</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(order.status)}`}></div>
                                        <div>
                                            <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                            <p className="text-sm text-gray-600">
                                                {order.customerName} • {order.items.length} items
                                                {order.rider && (
                                                    <span className="ml-2 text-blue-600">
                                                        <FaMotorcycle className="inline w-3 h-3 mr-1" />
                                                        {order.rider.name}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatNaira(order.total)}</p>
                                        <p className="text-sm text-gray-500">{formatTimeAgo(order.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    )
}