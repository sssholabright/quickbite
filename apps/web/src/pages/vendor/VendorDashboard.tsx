import { FaClipboardList, FaUtensils, FaDollarSign, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/layout/VendorLayout'
import { useOrderStats } from '../../hooks/useOrders'

// Helper function to format Naira currency
const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`
}

export default function VendorDashboard() {
    const { data: orderStats, isLoading: statsLoading } = useOrderStats()

    // Mock data for revenue (would come from API)
    const mockData = {
        todayRevenue: 284050, // Naira amount (no decimal places)
        weekRevenue: 1875025, // Naira amount (no decimal places)
    }

    return (
        <VendorLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your restaurant today.</p>
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
                                <p className="text-2xl font-bold text-gray-900">{formatNaira(mockData.todayRevenue)}</p>
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
                    <div className="space-y-4">
                        {/* Mock recent orders */}
                        {[
                            { id: '#QB-001', customer: 'John Doe', items: 3, total: 4550, status: 'preparing', time: '2 min ago' },
                            { id: '#QB-002', customer: 'Jane Smith', items: 2, total: 2875, status: 'pending', time: '5 min ago' },
                            { id: '#QB-003', customer: 'Mike Johnson', items: 4, total: 6725, status: 'ready', time: '8 min ago' },
                        ].map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                        order.status === 'pending' ? 'bg-yellow-500' :
                                        order.status === 'preparing' ? 'bg-blue-500' :
                                        order.status === 'ready' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                    <div>
                                        <p className="font-medium text-gray-900">{order.id}</p>
                                        <p className="text-sm text-gray-600">{order.customer} • {order.items} items</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">{formatNaira(order.total)}</p>
                                    <p className="text-sm text-gray-500">{order.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </VendorLayout>
    )
}