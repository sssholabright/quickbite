import { useEffect, useState } from 'react'
import { Order, OrderFilters as OrderFiltersType } from '../../types/order'
import VendorLayout from '../../components/layout/VendorLayout'
import OrderCard from '../../components/orders/OrderCard'
import { FaSync, FaFilter, FaClipboardList, FaWifi, FaMotorcycle, FaExclamationTriangle } from 'react-icons/fa'
import OrderStats from '../../components/orders/OrderStats'
import OrderFilters from '../../components/orders/OrderFilters'
import { useOrderStats, useUpdateOrderStatus, useCancelOrder } from '../../hooks/useOrders'
import { useEnhancedOrders } from '../../hooks/useEnhancedOrders'
import { useRealtimeStore } from '../../stores/realtimeStore'
import { showConfirm, showSuccess, showError } from '../../utils/sweetAlert'
import Pagination from '../../components/ui/Pagination'

export default function OrdersPage() {
    const [showFilters, setShowFilters] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [filters, setFilters] = useState<OrderFiltersType>({})
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10) // You can make this configurable

    // Enhanced orders with real-time updates
    const { 
        data: ordersData, 
        isLoading, 
        error, 
        refetch: refetchOrders 
    } = useEnhancedOrders({ ...filters, page: currentPage, limit: itemsPerPage })
    
    // Get order statistics from dedicated endpoint (not from filtered orders)
    const { 
        data: stats, 
        refetch: refetchStats 
    } = useOrderStats()

    const updateOrderStatusMutation = useUpdateOrderStatus()
    const cancelOrderMutation = useCancelOrder()
    const { connectionStatus } = useRealtimeStore()

    const orders = ordersData?.orders || []

    // Auto-refresh functionality
    // useEffect(() => {
    //     if (!autoRefresh) return

    //     const interval = setInterval(() => {
    //         refetchOrders()
    //         refetchStats()
    //     }, 30000)

    //     return () => clearInterval(interval)
    // }, [autoRefresh, refetchOrders, refetchStats])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFilterChange = (newFilters: OrderFiltersType) => {
        setFilters(newFilters)
        setCurrentPage(1) // Reset to first page when filters change
    }

    const handleRefresh = () => {
        refetchOrders()
        refetchStats()
    }

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        const statusText = getStatusText(newStatus)
        const result = await showConfirm(
            'Update Order Status',
            `Are you sure you want to mark this order as "${statusText}"?`,
            `Yes, mark as ${statusText}`,
            'Cancel'
        )

        if (result) {
            try {
                await updateOrderStatusMutation.mutateAsync({
                    orderId,
                    statusUpdate: { status: newStatus }
                })
                showSuccess('Status Updated', `Order has been marked as ${statusText}`)
            } catch (error) {
                console.error('Failed to update order status:', error)
                showError('Error', 'Failed to update order status. Please try again.')
            }
        }
    }

    const handleAcceptOrder = async (orderId: string) => {
        const result = await showConfirm(
            'Accept Order',
            `Are you sure you want to accept this order?`,
            'Yes, accept order',
            'Cancel'
        )

        if (result) {
            try {
                await updateOrderStatusMutation.mutateAsync({
                    orderId,
                    statusUpdate: { status: 'CONFIRMED' }
                })
                showSuccess('Order Accepted', 'Order has been accepted successfully')
            } catch (error) {
                console.error('Failed to accept order:', error)
                showError('Error', 'Failed to accept order. Please try again.')
            }
        }
    }

    const handleRejectOrder = async (orderId: string) => {
        const result = await showConfirm(
            'Reject Order',
            `Are you sure you want to reject this order? This action cannot be undone.`,
            'Yes, reject order',
            'Cancel'
        )

        if (result) {
            try {
                await cancelOrderMutation.mutateAsync({
                    orderId,
                    reason: 'Rejected by vendor'
                })
                showSuccess('Order Rejected', 'Order has been rejected')
            } catch (error) {
                console.error('Failed to reject order:', error)
                showError('Error', 'Failed to reject order. Please try again.')
            }
        }
    }

    // 🚀 NEW: Handle marking order as ready for pickup
    const handleMarkReady = async (orderId: string) => {
        const result = await showConfirm(
            'Mark Order Ready',
            `Mark this order as ready for pickup? This will notify available riders.`,
            'Yes, mark ready',
            'Cancel'
        )

        if (result) {
            try {
                await updateOrderStatusMutation.mutateAsync({
                    orderId,
                    statusUpdate: { status: 'READY_FOR_PICKUP' }
                })
                showSuccess('Order Ready', 'Order has been marked as ready for pickup. Riders will be notified.')
            } catch (error) {
                console.error('Failed to mark order as ready:', error)
                showError('Error', 'Failed to mark order as ready. Please try again.')
            }
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending'
            case 'CONFIRMED': return 'Confirmed'
            case 'PREPARING': return 'Preparing'
            case 'READY_FOR_PICKUP': return 'Ready for Pickup'
            case 'ASSIGNED': return 'Assigned to Rider'
            case 'PICKED_UP': return 'Picked Up'
            case 'OUT_FOR_DELIVERY': return 'Out for Delivery'
            case 'DELIVERED': return 'Delivered'
            case 'CANCELLED': return 'Cancelled'
            default: return status
        }
    }

    // Group orders by status for better organization
    const groupedOrders = {
        pending: orders.filter(order => order.status === 'PENDING'),
        confirmed: orders.filter(order => order.status === 'CONFIRMED'),
        preparing: orders.filter(order => order.status === 'PREPARING'),
        ready: orders.filter(order => order.status === 'READY_FOR_PICKUP'),
        assigned: orders.filter(order => order.status === 'ASSIGNED'),
        pickedUp: orders.filter(order => order.status === 'PICKED_UP'),
        delivered: orders.filter(order => order.status === 'DELIVERED'),
        cancelled: orders.filter(order => order.status === 'CANCELLED')
    }

    return (
        <VendorLayout>
            <div className="space-y-6">
                {/* Header with connection status */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <FaClipboardList className="mr-3" />
                            Orders
                        </h1>
                        
                        {/* Connection status indicator */}
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            connectionStatus === 'connected' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            <FaWifi className={`w-3 h-3 mr-1 ${
                                connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                            }`} />
                            {connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* Auto-refresh toggle */}
                        {/* <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
                        </label> */}
                        
                        {/* Manual refresh */}
                        {/* <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaSync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button> */}
                        
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
                        <p className="text-red-600">{error.message}</p>
                    </div>
                )}

                {/* Order Statistics - shows total stats from database */}
                {stats && <OrderStats stats={stats} />}

                {/* Filters */}
                {showFilters && (
                    <OrderFilters 
                        filters={filters}
                        onFiltersChange={handleFilterChange}
                    />
                )}
                

                {/* Orders by Status */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onAccept={() => handleAcceptOrder(order.id)}
                                onReject={() => handleRejectOrder(order.id)}
                                onStatusUpdate={(status) => handleStatusUpdate(order.id, status)}
                                onMarkReady={() => handleMarkReady(order.id)}
                                isLoading={updateOrderStatusMutation.isPending || cancelOrderMutation.isPending}
                            />
                        ))}
                        
                        {/* Pagination */}
                        {ordersData && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(ordersData.total / itemsPerPage)}
                                    totalItems={ordersData.total}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-500">
                            {Object.keys(filters).length > 0 
                                ? 'Try adjusting your filters to see more orders.'
                                : 'Orders will appear here when customers place them.'
                            }
                        </p>
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
        </VendorLayout>
    )
}