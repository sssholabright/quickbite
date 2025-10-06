import { FaClipboardList, FaUtensils, FaDollarSign, FaClock, FaCheckCircle, FaMotorcycle, FaUsers, FaChartLine, FaArrowRight } from 'react-icons/fa'
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
        .reduce((total, order) => order.items.reduce((acc, item) => acc + item.totalPrice, 0), 0)

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="space-y-8">
                    {/* Page Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto sm:mx-0">
                                    <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Dashboard Overview
                                    </h1>
                                    <p className="mt-2 text-gray-600 text-base sm:text-lg">
                                        Welcome back! Here's what's happening with your restaurant today.
                                    </p>
                                </div>
                            </div>
                            {/* Connection Status */}
                            <div className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gray-50 rounded-2xl px-4 py-2 sm:px-6 sm:py-3 mt-4 sm:mt-0">
                                <div
                                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                        connectionStatus === 'connected'
                                            ? 'bg-green-500 animate-pulse'
                                            : 'bg-red-500'
                                    }`}
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                    {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Pending Orders */}
                        <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Pending Orders</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '...' : orderStats?.pending || 0}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-yellow-600">
                                        <FaChartLine className="w-3 h-3 mr-1" />
                                        <span>Awaiting confirmation</span>
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300">
                                    <FaClock className="w-8 h-8 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        {/* Preparing Orders */}
                        <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Preparing</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '...' : orderStats?.preparing || 0}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-blue-600">
                                        <FaUtensils className="w-3 h-3 mr-1" />
                                        <span>In kitchen</span>
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                                    <FaUtensils className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Ready Orders */}
                        <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Ready for Pickup</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '...' : orderStats?.ready || 0}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-green-600">
                                        <FaCheckCircle className="w-3 h-3 mr-1" />
                                        <span>Ready to go</span>
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                                    <FaCheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Today's Revenue */}
                        <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-lg p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-emerald-100 mb-2">Today's Revenue</p>
                                    <p className="text-3xl font-bold text-white">
                                        {formatNaira(todayRevenue)}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-emerald-100">
                                        <FaDollarSign className="w-3 h-3 mr-1" />
                                        <span>Total earnings</span>
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                                    <FaDollarSign className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
                                <FaUsers className="w-6 h-6 text-primary-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link 
                                to="/vendor/orders"
                                className="group flex items-center justify-between p-8 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl border border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                        <FaClipboardList className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900">View Orders</h3>
                                        <p className="text-blue-700 font-medium">Manage incoming and active orders</p>
                                    </div>
                                </div>
                                <FaArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>

                            <Link 
                                to="/vendor/menu"
                                className="group flex items-center justify-between p-8 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl border border-green-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                        <FaUtensils className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900">Update Menu</h3>
                                        <p className="text-green-700 font-medium">Add, edit, or remove menu items</p>
                                    </div>
                                </div>
                                <FaArrowRight className="w-6 h-6 text-green-600 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                                    <FaClipboardList className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                            </div>
                            <Link 
                                to="/vendor/orders"
                                className="group flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
                            >
                                <span>View All</span>
                                <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </Link>
                        </div>
                        
                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                    <FaClipboardList className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600" size={20} />
                                </div>
                                <span className="ml-4 text-gray-600 text-lg">Loading orders...</span>
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FaClipboardList className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No recent orders</h3>
                                <p className="text-gray-600">Orders will appear here as they come in</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="group flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl transition-all duration-300 hover:shadow-md">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-4 h-4 rounded-full ${getStatusColor(order.status)} shadow-sm`}></div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{order.orderNumber}</p>
                                                <p className="text-gray-600 font-medium">
                                                    {order.customerName} • {order.items.length} items
                                                    {order.rider && (
                                                        <span className="ml-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                            <FaMotorcycle className="w-3 h-3 mr-1" />
                                                            {order.rider.name}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-lg">{formatNaira(order.items.reduce((acc, item) => acc + item.totalPrice, 0))}</p>
                                            <p className="text-gray-500 font-medium">{formatTimeAgo(order.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </VendorLayout>
    )
}