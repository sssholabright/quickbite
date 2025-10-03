import React, { useState, useEffect } from 'react';
import { CustomerFilters } from '../../types/customers';

interface CustomersFiltersProps {
    filters: CustomerFilters;
    onFiltersChange: (filters: CustomerFilters) => void;
}

const CustomersFilters: React.FC<CustomersFiltersProps> = ({ filters, onFiltersChange }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateRange, setDateRange] = useState(filters.dateRange || { start: '', end: '' });
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    // Debounced search
    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            onFiltersChange({
                ...filters,
                search: search.trim() || undefined,
            });
        }, 500);

        setSearchTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [search]);

    const handleStatusChange = (newStatus: string) => {
        const statusValue = newStatus === '' ? undefined : newStatus as CustomerFilters['status'];
        onFiltersChange({
            ...filters,
            status: statusValue,
        });
    };

    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        const newDateRange = {
            ...dateRange,
            [field]: value,
        };
        setDateRange(newDateRange);

        // Only apply filter if both dates are set
        if (newDateRange.start && newDateRange.end) {
            onFiltersChange({
                ...filters,
                dateRange: newDateRange,
            });
        } else if (!newDateRange.start && !newDateRange.end) {
            onFiltersChange({
                ...filters,
                dateRange: undefined,
            });
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setDateRange({ start: '', end: '' });
        onFiltersChange({});
    };

    const hasActiveFilters = filters.search || filters.status || filters.dateRange;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Customers
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="VERIFICATION_PENDING">Verification Pending</option>
                    </select>
                </div>

                {/* Date Range Start */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Date Range End */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomersFilters;
