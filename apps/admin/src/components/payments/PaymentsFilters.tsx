import React, { useState, useEffect } from 'react';
import { PaymentFilters } from '../../types/payments';

interface PaymentsFiltersProps {
    filters: PaymentFilters;
    onFiltersChange: (filters: PaymentFilters) => void;
}

const PaymentsFilters: React.FC<PaymentsFiltersProps> = ({ filters, onFiltersChange }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [gateway, setGateway] = useState(filters.gateway || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.paymentMethod || '');
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
        const statusValue = newStatus === '' ? undefined : newStatus as PaymentFilters['status'];
        onFiltersChange({
            ...filters,
            status: statusValue,
        });
    };

    const handleGatewayChange = (newGateway: string) => {
        const gatewayValue = newGateway === '' ? undefined : newGateway as PaymentFilters['gateway'];
        onFiltersChange({
            ...filters,
            gateway: gatewayValue,
        });
    };

    const handlePaymentMethodChange = (newMethod: string) => {
        const methodValue = newMethod === '' ? undefined : newMethod as PaymentFilters['paymentMethod'];
        onFiltersChange({
            ...filters,
            paymentMethod: methodValue,
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
        setGateway('');
        setPaymentMethod('');
        setDateRange({ start: '', end: '' });
        setAmountRange({ min: '', max: '' });
        onFiltersChange({});
    };

    const hasActiveFilters = filters.search || filters.status || filters.gateway || 
                           filters.paymentMethod || filters.dateRange || filters.amountRange;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Payments
                    </label>
                    <input
                        type="text"
                        placeholder="Search by transaction ID, customer email..."
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
                        <option value="REFUNDED">Refunded</option>
                    </select>
                </div>

                {/* Gateway Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gateway
                    </label>
                    <select
                        value={gateway}
                        onChange={(e) => handleGatewayChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Gateways</option>
                        <option value="PAYSTACK">Paystack</option>
                        <option value="FLUTTERWAVE">Flutterwave</option>
                        <option value="STRIPE">Stripe</option>
                        <option value="SQUARE">Square</option>
                    </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                    </label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Methods</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="WALLET">Wallet</option>
                        <option value="CASH">Cash</option>
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

export default PaymentsFilters;
