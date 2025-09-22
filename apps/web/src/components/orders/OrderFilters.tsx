import { useState } from 'react'
import { OrderFilters as OrderFiltersType, OrderStatus } from '../../types/order'
import { FaSearch, FaCalendarAlt } from 'react-icons/fa'

interface OrderFiltersProps {
    filters: OrderFiltersType
    onFiltersChange: (filters: OrderFiltersType) => void
}

export default function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
    const [localFilters, setLocalFilters] = useState<OrderFiltersType>(filters)

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

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={localFilters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <FaSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
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
                        <option value="READY_FOR_PICKUP">Ready</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

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
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    )
}