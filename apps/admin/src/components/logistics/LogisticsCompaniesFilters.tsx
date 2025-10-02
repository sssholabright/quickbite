import React, { useState, useEffect } from 'react';
import { LogisticsCompaniesListParams } from '../../types/logistics';
import { 
    FaSearch, 
    FaFilter, 
    FaTimes,
    FaBuilding
} from 'react-icons/fa';

interface LogisticsCompaniesFiltersProps {
    filters: LogisticsCompaniesListParams['filters'];
    onFiltersChange: (filters: any) => void;
    isLoading: boolean;
}

export default function LogisticsCompaniesFilters({ 
    filters, 
    onFiltersChange, 
    isLoading 
}: LogisticsCompaniesFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        const timeout = setTimeout(() => {
            handleFilterChange('search', searchTerm);
        }, 500);
        setSearchTimeout(timeout);
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [searchTerm]);

    const handleFilterChange = (key: string, value: string) => {
        const cleanValue = value.trim() === '' ? undefined : value.trim();
        onFiltersChange({ [key]: cleanValue });
    };

    const clearFilters = () => {
        onFiltersChange({});
        setSearchTerm('');
    };

    const hasActiveFilters = Object.values(filters || {}).some(value => value) || searchTerm.trim() !== '';

    return (
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by company name, contact person, phone, or email..."
                        value={filters?.search || searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        disabled={isLoading}
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                        showFilters || hasActiveFilters
                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={isLoading}
                >
                    <FaFilter className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                        <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {Object.values(filters || {}).filter(v => v).length + (searchTerm ? 1 : 0)}
                        </span>
                    )}
                </button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={isLoading}
                    >
                        <FaTimes className="w-4 h-4 mr-1" />
                        Clear
                    </button>
                )}
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filters?.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}