import React, { useState, useEffect } from 'react';
import { PayoutFilters } from '../../types/payouts';

interface PayoutsFiltersProps {
    filters: PayoutFilters;
    onFiltersChange: (filters: PayoutFilters) => void;
}

const PayoutsFilters: React.FC<PayoutsFiltersProps> = ({ filters, onFiltersChange }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [recipientType, setRecipientType] = useState(filters.recipientType || '');
    const [dateRange, setDateRange] = useState(filters.dateRange || { start: '', end: '' });
    const [amountRange, setAmountRange] = useState(filters.amountRange || { min: '', max: '' });
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
        const statusValue = newStatus === '' ? undefined : newStatus as PayoutFilters['status'];
        onFiltersChange({
            ...filters,
            status: statusValue,
        });
    };

    const handleRecipientTypeChange = (newType: string) => {
        const typeValue = newType === '' ? undefined : newType as PayoutFilters['recipientType'];
        onFiltersChange({
            ...filters,
            recipientType: typeValue,
        });
    };

    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        const newDateRange = {
            ...dateRange,
            [field]: value,
        };
        setDateRange(newDateRange);

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

    const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
        const newAmountRange = {
            ...amountRange,
            [field]: value,
        };
        setAmountRange(newAmountRange);

        const min = parseFloat(newAmountRange.min.toString());
        const max = parseFloat(newAmountRange.max.toString());

        if (!isNaN(min) && !isNaN(max)) {
            onFiltersChange({
                ...filters,
                amountRange: { min, max },
            });
        } else if (newAmountRange.min === '' && newAmountRange.max === '') {
            onFiltersChange({
                ...filters,
                amountRange: undefined,
            });
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setRecipientType('');
        setDateRange({ start: '', end: '' });
        setAmountRange({ min: '', max: '' });
        onFiltersChange({});
    };

    const hasActiveFilters = filters.search || filters.status || filters.recipientType || 
                           filters.dateRange || filters.amountRange;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Payouts
                    </label>
                    <input
                        type="text"
                        placeholder="Search by recipient name, payout ID..."
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
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>

                {/* Recipient Type Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Type
                    </label>
                    <select
                        value={recipientType}
                        onChange={(e) => handleRecipientTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="RIDER">Rider</option>
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

            {/* Amount Range */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Amount (₦)
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={amountRange.min}
                        onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Amount (₦)
                    </label>
                    <input
                        type="number"
                        placeholder="1000000"
                        value={amountRange.max}
                        onChange={(e) => handleAmountRangeChange('max', e.target.value)}
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

export default PayoutsFilters;
