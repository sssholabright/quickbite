import React from 'react';
import { OrderListItem, OrderSort } from '../../types/orders';
import { useAdminStore } from '../../stores/adminStore';
import { 
    FaChevronUp, 
    FaChevronDown, 
    FaEye, 
    FaUser, 
    FaMotorcycle, 
    FaTimes, 
    FaDollarSign,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';

interface OrdersTableProps {
    orders: OrderListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    isLoading: boolean;
    onOrderSelect: (orderId: string) => void;
    onPageChange: (page: number) => void;
    onSortChange: (field: string, direction: 'asc' | 'desc') => void;
    currentSort?: OrderSort;
}

export default function OrdersTable({
    orders,
    pagination,
    isLoading,
    onOrderSelect,
    onPageChange,
    onSortChange,
    currentSort
}: OrdersTableProps) {
    const { hasPermission } = useAdminStore();

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
            PREPARING: { color: 'bg-purple-100 text-purple-800', label: 'Preparing' },
            READY_FOR_PICKUP: { color: 'bg-orange-100 text-orange-800', label: 'Ready' },
            ASSIGNED: { color: 'bg-indigo-100 text-indigo-800', label: 'Assigned' },
            PICKED_UP: { color: 'bg-cyan-100 text-cyan-800', label: 'Picked Up' },
            OUT_FOR_DELIVERY: { color: 'bg-teal-100 text-teal-800', label: 'On Route' },
            DELIVERED: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
            CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { 
            color: 'bg-gray-100 text-gray-800', 
            label: status 
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSort = (field: string) => {
        const direction = currentSort?.field === field && currentSort?.direction === 'asc' ? 'desc' : 'asc';
        onSortChange(field, direction);
    };

    const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => {
        const isActive = currentSort?.field === field;
        const isAsc = isActive && currentSort?.direction === 'asc';
        const isDesc = isActive && currentSort?.direction === 'desc';

        return (
            <button
                onClick={() => handleSort(field)}
                className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
            >
                <span className="truncate">{children}</span>
                <div className="flex flex-col flex-shrink-0">
                    <FaChevronUp 
                        className={`w-3 h-3 ${isAsc ? 'text-primary-600' : 'text-gray-400'}`} 
                    />
                    <FaChevronDown 
                        className={`w-3 h-3 -mt-1 ${isDesc ? 'text-primary-600' : 'text-gray-400'}`} 
                    />
                </div>
            </button>
        );
    };

    const getRowNumber = (index: number) => {
        if (!pagination) return index + 1;
        return (pagination.page - 1) * pagination.limit + index + 1;
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
                <div className="space-y-4 p-4">
                    {orders.map((order, index) => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">
                                        #{order.orderNumber}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        #{getRowNumber(index)}
                                    </div>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                    <FaUser className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                    <span className="text-gray-600">Customer:</span>
                                    <span className="ml-2 font-medium text-gray-900">{order.customer.name}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <FaMotorcycle className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                    <span className="text-gray-600">Vendor:</span>
                                    <span className="ml-2 font-medium text-gray-900 truncate">{order.vendor.businessName}</span>
                                </div>
                                
                                {order.rider && (
                                    <div className="flex items-center">
                                        <FaMotorcycle className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                        <span className="text-gray-600">Rider:</span>
                                        <span className="ml-2 font-medium text-gray-900">{order.rider.name}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center">
                                    <FaDollarSign className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(order.total)}</span>
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                    {formatDateTime(order.createdAt)}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                                <button
                                    onClick={() => onOrderSelect(order.id)}
                                    className="flex items-center text-primary-600 hover:text-primary-900 transition-colors text-sm"
                                >
                                    <FaEye className="w-4 h-4 mr-1" />
                                    View Details
                                </button>
                                
                                {hasPermission('orders.write') && (
                                    <button
                                        onClick={() => onOrderSelect(order.id)}
                                        className="flex items-center text-blue-600 hover:text-blue-900 transition-colors text-sm"
                                    >
                                        <FaUser className="w-4 h-4 mr-1" />
                                        Manage
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider w-16">
                                #
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider">
                                <SortButton field="orderNumber">Order ID</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider hidden md:table-cell">
                                Vendor
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider hidden lg:table-cell">
                                Rider
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider">
                                <SortButton field="status">Status</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider hidden md:table-cell">
                                <SortButton field="total">Amount</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider hidden lg:table-cell">
                                <SortButton field="createdAt">Date/Time</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order, index) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold w-16">
                                    {getRowNumber(index)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-normal">
                                        #{order.orderNumber}
                                    </div>
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaUser className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {order.customer.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {order.customer.phone}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-sm text-gray-900 truncate">
                                        {order.vendor.businessName}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                        {order.vendor.name}
                                    </div>
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                    {order.rider ? (
                                        <div className="flex items-center">
                                            <FaMotorcycle className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {order.rider.name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {order.rider.vehicleType}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">Not assigned</span>
                                    )}
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(order.status)}
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="flex items-center">
                                        <FaDollarSign className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </div>
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                    {formatDateTime(order.createdAt)}
                                </td>
                                
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onOrderSelect(order.id)}
                                            className="text-primary-600 hover:text-primary-900 transition-colors p-1"
                                            title="View Details"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </button>
                                        
                                        {hasPermission('orders.write') && (
                                            <button
                                                onClick={() => onOrderSelect(order.id)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                                title="Manage Order"
                                            >
                                                <FaUser className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Responsive Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    {/* Mobile pagination */}
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </button>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-700">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <FaChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    
                    {/* Desktop pagination */}
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                    {(pagination.page - 1) * pagination.limit + 1}
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
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {/* Page numbers - responsive */}
                                {Array.from({ length: Math.min(window.innerWidth < 768 ? 3 : 5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, pagination.page - Math.floor((window.innerWidth < 768 ? 3 : 5) / 2)) + i;
                                    if (pageNum > pagination.totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                                                pageNum === pagination.page
                                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                
                                <button
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaChevronRight className="w-4 h-4" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
