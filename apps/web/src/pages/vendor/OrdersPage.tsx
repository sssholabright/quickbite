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
import React from 'react'
import { ORDER_PRIORITY } from '../../types/order'

export default function OrdersPage() {
    const [showFilters, setShowFilters] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)
    // 🚀 NEW: Default filters with priority sorting
    const [filters, setFilters] = useState<OrderFiltersType>({
        sortBy: 'priority', // Default to priority sorting
        sortOrder: 'asc'    // Ascending for priority (Pending first)
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

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

    // 🚀 NEW: Apply client-side priority sorting as fallback
    const sortedOrders = React.useMemo(() => {
        if (filters.sortBy === 'priority') {
            return [...orders].sort((a, b) => {
                const priorityA = ORDER_PRIORITY[a.status] || 999
                const priorityB = ORDER_PRIORITY[b.status] || 999
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB
                }
                
                // If same priority, sort by creation date
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
        }
        return orders
    }, [orders, filters.sortBy])

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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-600">Manage and track your orders</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm text-gray-600">
                                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                showFilters 
                                    ? 'bg-primary-50 border-primary-200 text-primary-700' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <FaFilter className="w-4 h-4" />
                            Filters
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Order Statistics */}
                {stats && <OrderStats stats={stats} />}

                {/* Filters */}
                {showFilters && (
                    <OrderFilters 
                        filters={filters} 
                        onFiltersChange={handleFilterChange} 
                    />
                )}

                {/* Orders List */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Orders ({ordersData?.total || 0})
                            </h2>
                            
                            {/* Sort Indicator */}
                            <div className="text-sm text-gray-500">
                                {filters.sortBy === 'priority' ? 'Sorted by Priority (Pending First)' : 
                                 `Sorted by ${filters.sortBy} (${filters.sortOrder})`}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading orders...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-600">Failed to load orders</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-2 text-primary-600 hover:text-primary-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : sortedOrders.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaClipboardList className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No orders found</p>
                            {Object.keys(filters).length > 0 && (
                                <button
                                    onClick={() => handleFilterChange({})}
                                    className="mt-2 text-primary-600 hover:text-primary-700"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {sortedOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onStatusUpdate={(status) => handleStatusUpdate(order.id, status)}
                                    onAccept={() => handleAcceptOrder(order.id)}
                                    onReject={() => handleRejectOrder(order.id)}
                                    onMarkReady={() => handleMarkReady(order.id)}
                                    isLoading={isLoading}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {ordersData && ordersData.total > itemsPerPage && (
                        <div className="p-6 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(ordersData.total / itemsPerPage)}
                                onPageChange={handlePageChange}
                                totalItems={ordersData.total}
                                itemsPerPage={itemsPerPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    )
}