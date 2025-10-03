import React, { useState, useEffect } from 'react';
import { VendorFilters } from '../../types/vendors';
import { FaSearch, FaFilter } from 'react-icons/fa';

interface VendorsFiltersProps {
    filters: VendorFilters;
    onFiltersChange: (filters: VendorFilters) => void;
}

export default function VendorsFilters({ filters, onFiltersChange }: VendorsFiltersProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            onFiltersChange({
                ...filters,
                search: searchTerm.trim() || undefined
            });
        }, 500);

        setSearchTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [searchTerm]);

    const handleStatusChange = (status: string) => {
        onFiltersChange({
            ...filters,
            status: status === 'all' ? undefined : status as VendorFilters['status']
        });
    };

    const handleIsOpenChange = (isOpen: string) => {
        onFiltersChange({
            ...filters,
            isOpen: isOpen === 'all' ? undefined : isOpen === 'true'
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        onFiltersChange({});
    };

    const hasActiveFilters = filters.search || filters.status || filters.isOpen !== undefined;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="Search vendors by name, email, or phone..."
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                        <FaFilter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filters.status || 'all'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>
                    </div>

                    {/* Open Status Filter */}
                    <div className="flex items-center space-x-2">
                        <select
                            value={filters.isOpen === undefined ? 'all' : filters.isOpen.toString()}
                            onChange={(e) => handleIsOpenChange(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-lg"
                        >
                            <option value="all">All</option>
                            <option value="true">Open</option>
                            <option value="false">Closed</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}