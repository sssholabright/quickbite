import React from 'react';
import { VendorListItem, VendorSort } from '../../types/vendors';
import { FaEye, FaEdit, FaMapMarkerAlt, FaClock, FaShoppingCart, FaStar } from 'react-icons/fa';
import { useAdminStore } from '../../stores/adminStore';

interface VendorsTableProps {
    vendors: VendorListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    isLoading: boolean;
    sort: VendorSort;
    onSortChange: (sort: VendorSort) => void;
    onPageChange: (page: number) => void;
    onVendorSelect: (vendorId: string) => void;
    onVendorEdit: (vendorId: string) => void;
}

export default function VendorsTable({
    vendors,
    pagination,
    isLoading,
    sort,
    onSortChange,
    onPageChange,
    onVendorSelect,
    onVendorEdit
}: VendorsTableProps) {
    const { hasPermission } = useAdminStore();
    const canEdit = hasPermission('vendors.write');

    const getStatusBadge = (status: VendorListItem['status']) => {
        const statusConfig = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Suspended' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            BLOCKED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Blocked' }
        };

        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getOpenStatusBadge = (isOpen: boolean) => {
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
            }`}>
                {isOpen ? 'Open' : 'Closed'}
            </span>
        );
    };

    const getRowNumber = (index: number) => {
        return ((pagination?.page || 1) - 1) * (pagination?.limit || 20) + index + 1;
    };

    const handleSort = (field: VendorSort['field']) => {
        const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
        onSortChange({ field, direction: newDirection });
    };

    const SortButton = ({ field, children }: { field: VendorSort['field']; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-primary-600 focus:outline-none"
        >
            <span>{children}</span>
            <span className="flex flex-col">
                <span className={`text-xs ${sort.field === field && sort.direction === 'asc' ? 'text-primary-600' : 'text-gray-400'}`}>
                    ▲
                </span>
                <span className={`text-xs ${sort.field === field && sort.direction === 'desc' ? 'text-primary-600' : 'text-gray-400'}`}>
                    ▼
                </span>
            </span>
        </button>
    );

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Loading vendors...</p>
            </div>
        );
    }

    if (vendors.length === 0) {
        return (
            <div className="p-8 text-center">
                <FaShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter criteria.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="businessName">Vendor</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Performance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="avgPrepTime">Prep Time</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="createdAt">Created</SortButton>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vendors.map((vendor, index) => (
                            <tr key={vendor.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getRowNumber(index)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {vendor.logo ? (
                                            <img
                                                className="h-10 w-10 rounded-full object-cover"
                                                src={vendor.logo}
                                                alt={vendor.businessName}
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {vendor.businessName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {vendor.businessName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {vendor.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        {getStatusBadge(vendor.status)}
                                        {getOpenStatusBadge(vendor.isOpen)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <FaShoppingCart className="h-4 w-4 text-gray-400 mr-1" />
                                            {vendor.totalOrders} orders
                                        </div>
                                        <div className="flex items-center mt-1">
                                            <FaStar className="h-4 w-4 text-yellow-400 mr-1" />
                                            {vendor.rating.toFixed(1)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {vendor.avgPrepTime ? (
                                        <div className="flex items-center">
                                            <FaClock className="h-4 w-4 text-gray-400 mr-1" />
                                            {vendor.avgPrepTime.toFixed(0)}min
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {vendor.location.latitude && vendor.location.longitude ? (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FaMapMarkerAlt className="h-4 w-4 mr-1" />
                                            <span className="truncate max-w-32">
                                                {vendor.location.address || 'Location set'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Not set</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(vendor.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => onVendorSelect(vendor.id)}
                                            className="text-primary-600 hover:text-primary-900 p-1"
                                            title="View Details"
                                        >
                                            <FaEye className="h-4 w-4" />
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={() => onVendorEdit(vendor.id)}
                                                className="text-gray-600 hover:text-gray-900 p-1"
                                                title="Edit Vendor"
                                            >
                                                <FaEdit className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
                {vendors.map((vendor, index) => (
                    <div key={vendor.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                {vendor.logo ? (
                                    <img
                                        className="h-12 w-12 rounded-full object-cover"
                                        src={vendor.logo}
                                        alt={vendor.businessName}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-lg font-medium text-gray-600">
                                            {vendor.businessName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {vendor.businessName}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {vendor.email}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {getStatusBadge(vendor.status)}
                                        {getOpenStatusBadge(vendor.isOpen)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onVendorSelect(vendor.id)}
                                    className="text-primary-600 hover:text-primary-900 p-1"
                                    title="View Details"
                                >
                                    <FaEye className="h-4 w-4" />
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => onVendorEdit(vendor.id)}
                                        className="text-gray-600 hover:text-gray-900 p-1"
                                        title="Edit Vendor"
                                    >
                                        <FaEdit className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Orders:</span>
                                <span className="ml-1 font-medium">{vendor.totalOrders}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Rating:</span>
                                <span className="ml-1 font-medium">{vendor.rating.toFixed(1)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Prep Time:</span>
                                <span className="ml-1 font-medium">
                                    {vendor.avgPrepTime ? `${vendor.avgPrepTime.toFixed(0)}min` : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Created:</span>
                                <span className="ml-1 font-medium">
                                    {new Date(vendor.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                    {((pagination.page - 1) * pagination.limit) + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">{pagination.total}</span>{' '}
                                results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(page => 
                                        page === 1 || 
                                        page === pagination.totalPages || 
                                        Math.abs(page - pagination.page) <= 2
                                    )
                                    .map((page, index, array) => (
                                        <React.Fragment key={page}>
                                            {index > 0 && array[index - 1] !== page - 1 && (
                                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                    ...
                                                </span>
                                            )}
                                            <button
                                                onClick={() => onPageChange(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    page === pagination.page
                                                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                <button
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}