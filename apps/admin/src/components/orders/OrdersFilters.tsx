import React, { useState, useEffect } from 'react';
import { OrderFilters } from '../../types/orders';
import { 
    FaSearch, 
    FaFilter, 
    FaTimes,
    FaCalendarAlt,
    FaUser,
    FaStore,
    FaMotorcycle,
    FaBars
} from 'react-icons/fa';

interface OrdersFiltersProps {
    filters: OrderFilters;
    onFiltersChange: (filters: Partial<OrderFilters>) => void;
    isLoading: boolean;
}

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersFilters({ filters, onFiltersChange, isLoading }: OrdersFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    useEffect(() => {
        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout for debounced search
        const timeout = setTimeout(() => {
            handleFilterChange('search', searchTerm);
        }, 500);

        setSearchTimeout(timeout);

        // Cleanup timeout on unmount
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [searchTerm]);

    const handleFilterChange = (key: keyof OrderFilters, value: string) => {
        // Convert empty strings to undefined
        const cleanValue = value.trim() === '' ? undefined : value.trim();
        onFiltersChange({ [key]: cleanValue });
    };

    const clearFilters = () => {
        onFiltersChange({});
        setSearchTerm('');
    };

    const hasActiveFilters = Object.values(filters).some(value => value) || searchTerm.trim() !== '';

    return (
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by customer, vendor, rider, or order number..."
                        value={filters.search || searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        disabled={isLoading}
                    />
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                            showFilters || hasActiveFilters
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isLoading}
                    >
                        <FaFilter className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters && (
                            <span className="ml-2 bg-white text-primary-600 rounded-full px-2 py-1 text-xs font-medium">
                                {Object.values(filters).filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                            title="Clear all filters"
                        >
                            <FaTimes className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaFilter className="w-4 h-4 inline mr-1" />
                                Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaCalendarAlt className="w-4 h-4 inline mr-1" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={filters.date || ''}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Vendor Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaStore className="w-4 h-4 inline mr-1" />
                                Vendor ID
                            </label>
                            <input
                                type="text"
                                placeholder="Enter vendor ID..."
                                value={filters.vendorId || ''}
                                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Rider Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaMotorcycle className="w-4 h-4 inline mr-1" />
                                Rider ID
                            </label>
                            <input
                                type="text"
                                placeholder="Enter rider ID..."
                                value={filters.riderId || ''}
                                onChange={(e) => handleFilterChange('riderId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
