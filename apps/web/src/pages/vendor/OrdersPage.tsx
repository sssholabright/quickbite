import { useEffect, useState } from 'react'
import { Order, OrderFilters as OrderFiltersType } from '../../types/order'
import VendorLayout from '../../components/layout/VendorLayout'
import OrderCard from '../../components/orders/OrderCard'
import { FaSync, FaFilter, FaClipboardList, FaWifi, FaMotorcycle, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaSearch, FaSort } from 'react-icons/fa'
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
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    
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
                // 🚀 FIXED: Make success message less intrusive for routine status updates
                const routineStatuses = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'];
                if (routineStatuses.includes(newStatus)) {
                    // Use a toast notification instead of SweetAlert for routine updates
                    console.log(`✅ Order ${orderId} marked as ${statusText}`);
                } else {
                    showSuccess('Status Updated', `Order has been marked as ${statusText}`)
                }
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <FaClipboardList className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Orders Management
                                    </h1>
                                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Track and manage all your restaurant orders</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Connection Status */}
                                <div className="flex items-center justify-center sm:justify-start space-x-3 bg-gray-50 rounded-2xl px-4 py-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                    }`} />
                                    <span className="text-sm font-medium text-gray-700">
                                        {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
                                    </span>
                                </div>

                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className="lg:hidden flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all duration-200 shadow-lg"
                                >
                                    <FaFilter className="w-4 h-4" />
                                    <span className="font-medium">Filters</span>
                                    {showMobileFilters ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                                </button>

                                {/* Desktop Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="hidden lg:flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                >
                                    <FaFilter className="w-4 h-4" />
                                    <span className="font-medium">Filters</span>
                                </button>

                                {/* Refresh Button */}
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                >
                                    <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span className="font-medium hidden sm:inline">Refresh</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Order Statistics */}
                    {stats && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <OrderStats stats={stats} />
                        </div>
                    )}

                    {/* Mobile Filters */}
                    {showMobileFilters && (
                        <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <OrderFilters 
                                filters={filters} 
                                onFiltersChange={handleFilterChange} 
                            />
                        </div>
                    )}

                    {/* Desktop Filters */}
                    {showFilters && (
                        <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <OrderFilters 
                                filters={filters} 
                                onFiltersChange={handleFilterChange} 
                            />
                        </div>
                    )}

                    {/* Orders List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-3">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Orders
                                    </h2>
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                                        {ordersData?.total || 0}
                                    </span>
                                </div>
                                
                                {/* Sort Indicator */}
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <FaSort className="w-4 h-4" />
                                    <span>
                                        {filters.sortBy === 'priority' ? 'Sorted by Priority' : 
                                         `Sorted by ${filters.sortBy} (${filters.sortOrder})`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="p-12 sm:p-16 text-center">
                                <div className="relative inline-block">
                                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <FaClipboardList className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600" size={20} />
                                </div>
                                <p className="text-gray-600 text-lg">Loading orders...</p>
                            </div>
                        ) : error ? (
                            <div className="p-12 sm:p-16 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FaExclamationTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load orders</h3>
                                <p className="text-gray-600 mb-6">Please check your connection and try again</p>
                                <button
                                    onClick={handleRefresh}
                                    className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : sortedOrders.length === 0 ? (
                            <div className="p-12 sm:p-16 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FaClipboardList className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                                <p className="text-gray-600 mb-6">Orders will appear here as they come in</p>
                                {Object.keys(filters).length > 0 && (
                                    <button
                                        onClick={() => handleFilterChange({})}
                                        className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sortedOrders.map((order) => (
                                    <div key={order.id} className="p-6 sm:p-8 hover:bg-gray-50 transition-colors duration-200">
                                        <OrderCard
                                            order={order}
                                            onStatusUpdate={(status) => handleStatusUpdate(order.id, status)}
                                            onAccept={() => handleAcceptOrder(order.id)}
                                            onReject={() => handleRejectOrder(order.id)}
                                            onMarkReady={() => handleMarkReady(order.id)}
                                            isLoading={isLoading}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {ordersData && ordersData.total > itemsPerPage && (
                            <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50">
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
            </div>
        </VendorLayout>
    )
}