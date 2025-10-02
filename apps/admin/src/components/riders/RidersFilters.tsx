import React, { useState, useEffect } from 'react';
import { RidersListParams } from '../../types/logistics';
import { useAvailableCompanies } from '../../hooks/useRiders';
import { 
    FaSearch, 
    FaFilter, 
    FaTimes,
    FaMotorcycle,
    FaBuilding
} from 'react-icons/fa';

interface RidersFiltersProps {
    filters: RidersListParams['filters'];
    onFiltersChange: (filters: any) => void;
    isLoading: boolean;
}

export default function RidersFilters({ 
    filters, 
    onFiltersChange, 
    isLoading 
}: RidersFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    // Fetch available companies for filter
    const { data: companies } = useAvailableCompanies();

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

    const handleFilterChange = (key: string, value: string | boolean) => {
        const cleanValue = typeof value === 'string' && value.trim() === '' ? undefined : value;
        onFiltersChange({ [key]: cleanValue });
    };

    const clearFilters = () => {
        onFiltersChange({});
        setSearchTerm('');
    };

    const hasActiveFilters = Object.values(filters || {}).some(value => value !== undefined) || searchTerm.trim() !== '';

    return (
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by rider name, phone, email, or company..."
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
                            {Object.values(filters || {}).filter(v => v !== undefined).length + (searchTerm ? 1 : 0)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Company Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaBuilding className="w-3 h-3 inline mr-1" />
                                Company
                            </label>
                            <select
                                value={filters?.companyId || ''}
                                onChange={(e) => handleFilterChange('companyId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            >
                                <option value="">All Companies</option>
                                {companies?.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Online Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaMotorcycle className="w-3 h-3 inline mr-1" />
                                Status
                            </label>
                            <select
                                value={filters?.isOnline === undefined ? '' : filters.isOnline.toString()}
                                onChange={(e) => {
                                    const value = e.target.value === '' ? undefined : e.target.value === 'true';
                                    handleFilterChange('isOnline', value as boolean);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            >
                                <option value="">All Statuses</option>
                                <option value="true">Online</option>
                                <option value="false">Offline</option>
                            </select>
                        </div>

                        {/* Vehicle Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vehicle Type
                            </label>
                            <select
                                value={filters?.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            >
                                <option value="">All Vehicle Types</option>
                                <option value="BIKE">Bike</option>
                                <option value="MOTORCYCLE">Motorcycle</option>
                                <option value="CAR">Car</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}