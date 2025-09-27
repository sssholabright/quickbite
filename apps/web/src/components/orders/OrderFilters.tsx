import { useState, useEffect } from 'react'
import { OrderFilters as OrderFiltersType } from '../../types/order'
import { FaSearch, FaCalendarAlt, FaSort, FaFilter } from 'react-icons/fa'

interface OrderFiltersProps {
    filters: OrderFiltersType
    onFiltersChange: (filters: OrderFiltersType) => void
}

export default function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
    const [localFilters, setLocalFilters] = useState<OrderFiltersType>(filters)
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters)
    }, [filters])

    const handleFilterChange = (key: keyof OrderFiltersType, value: any) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const clearFilters = () => {
        const emptyFilters: OrderFiltersType = {}
        setLocalFilters(emptyFilters)
        onFiltersChange(emptyFilters)
    }

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'PENDING': 'Pending',
            'CONFIRMED': 'Confirmed',
            'PREPARING': 'Preparing',
            'READY_FOR_PICKUP': 'Ready for Pickup',
            'ASSIGNED': 'Assigned',
            'PICKED_UP': 'Picked Up',
            'OUT_FOR_DELIVERY': 'Out for Delivery',
            'DELIVERED': 'Delivered',
            'CANCELLED': 'Cancelled'
        }
        return statusMap[status] || status
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by order ID, customer name, or rider name..."
                            value={localFilters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <FaSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Search Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search In</label>
                    <select
                        value={localFilters.searchType || 'all'}
                        onChange={(e) => handleFilterChange('searchType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Fields</option>
                        <option value="orderId">Order ID</option>
                        <option value="customerName">Customer Name</option>
                        <option value="riderName">Rider Name</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                        value={localFilters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    <FaFilter className="w-4 h-4" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                </button>
                
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={localFilters.dateFrom || ''}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <FaCalendarAlt className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={localFilters.dateTo || ''}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <FaCalendarAlt className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <div className="relative">
                                <select
                                    value={localFilters.sortBy || 'priority'}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                >
                                    <option value="priority">Priority (Pending First)</option>
                                    <option value="createdAt">Date Created</option>
                                    <option value="status">Status</option>
                                    <option value="total">Total Amount</option>
                                </select>
                                <FaSort className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                            <select
                                value={localFilters.sortOrder || 'desc'}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}