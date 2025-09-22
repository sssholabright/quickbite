import { useEffect, useState } from 'react'
import { useOrderStore } from '../../stores/orderStore'
import { Order, OrderFilters as OrderFiltersType } from '../../types/order'
import VendorLayout from '../../components/layout/VendorLayout'
import OrderCard from '../../components/orders/OrderCard'
import { FaSync, FaFilter, FaClipboardList } from 'react-icons/fa'
import OrderStats from '../../components/orders/OrderStats'
import OrderFilters from '../../components/orders/OrderFilters'

export default function OrdersPage() {
    const { 
        orders, 
        stats, 
        isLoading, 
        error, 
        filters,
        fetchOrders, 
        fetchStats, 
        setFilters,
        refreshOrders 
    } = useOrderStore()
    
    const [showFilters, setShowFilters] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)

    // Fetch orders and stats on component mount
    useEffect(() => {
        fetchOrders()
        fetchStats()
    }, [fetchOrders, fetchStats])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            refreshOrders()
            fetchStats()
        }, 30000)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshOrders, fetchStats])

    const handleFilterChange = (newFilters: OrderFiltersType) => {
        setFilters(newFilters)
        fetchOrders(newFilters)
    }

    const handleRefresh = () => {
        refreshOrders()
        fetchStats()
    }

    // Group orders by status for better organization
    const groupedOrders = {
        pending: orders.filter(order => order.status === 'PENDING'),
        confirmed: orders.filter(order => order.status === 'CONFIRMED'),
        preparing: orders.filter(order => order.status === 'PREPARING'),
        ready: orders.filter(order => order.status === 'READY_FOR_PICKUP'),
        delivered: orders.filter(order => order.status === 'DELIVERED'),
        cancelled: orders.filter(order => order.status === 'CANCELLED')
    }

    return (
        <VendorLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                        <p className="mt-2 text-gray-600">Manage and track all your restaurant orders in real-time</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* Auto-refresh toggle */}
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
                        </label>
                        
                        {/* Manual refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaSync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        
                        {/* Filters toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaFilter className="w-4 h-4 mr-2" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Order Statistics */}
                {stats && <OrderStats stats={stats} />}

                {/* Filters */}
                {showFilters && (
                    <OrderFilters 
                        filters={filters}
                        onFiltersChange={handleFilterChange}
                    />
                )}

                {/* Orders by Status */}
                <div className="space-y-8">
                    {/* Pending Orders */}
                    {groupedOrders.pending.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                                Pending Orders ({groupedOrders.pending.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.pending.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmed Orders */}
                    {groupedOrders.confirmed.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                                Confirmed Orders ({groupedOrders.confirmed.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.confirmed.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preparing Orders */}
                    {groupedOrders.preparing.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                                Preparing Orders ({groupedOrders.preparing.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.preparing.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ready Orders */}
                    {groupedOrders.ready.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                                Ready for Pickup ({groupedOrders.ready.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.ready.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Delivered Orders */}
                    {groupedOrders.delivered.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                                Delivered Orders ({groupedOrders.delivered.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.delivered.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cancelled Orders */}
                    {groupedOrders.cancelled.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                                Cancelled Orders ({groupedOrders.cancelled.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedOrders.cancelled.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No orders message */}
                    {orders.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaClipboardList className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600">Orders will appear here when customers place them.</p>
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    )
}