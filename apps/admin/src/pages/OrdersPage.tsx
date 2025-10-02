import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import OrdersTable from '../components/orders/OrdersTable';
import OrdersFilters from '../components/orders/OrdersFilters';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import { useOrdersList } from '../hooks/useOrders';
import { useAdminStore } from '../stores/adminStore';
import { OrdersListParams } from '../types/orders';
import { 
    FaPlus, 
    FaSearch, 
    FaFilter, 
    FaDownload,
    FaSyncAlt 
} from 'react-icons/fa';

export default function OrdersPage() {
    const { hasPermission } = useAdminStore();
    
    // State for filters and pagination
    const [params, setParams] = useState<OrdersListParams>({
        page: 1,
        limit: 20,
        sort: { field: 'createdAt', direction: 'desc' }
    });
    
    // State for selected order
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    
    // Fetch orders data
    const { 
        data: ordersData, 
        isLoading, 
        isError, 
        error,
        refetch 
    } = useOrdersList(params);

    const handleFiltersChange = (newFilters: any) => {
        setParams(prev => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters },
            page: 1 // Reset to first page when filters change
        }));
    };

    const handlePageChange = (page: number) => {
        setParams(prev => ({ ...prev, page }));
    };

    const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
        setParams(prev => ({
            ...prev,
            sort: { field: field as any, direction }
        }));
    };

    const handleOrderSelect = (orderId: string) => {
        setSelectedOrder(orderId);
    };

    const handleRefresh = () => {
        refetch();
    };

    if (isError) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load orders</h3>
                        <p className="text-gray-600 mb-4">
                            {error?.message || 'Something went wrong while loading orders'}
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
                        <p className="text-gray-600">Monitor and manage all orders in real-time</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaSyncAlt className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        
                        {hasPermission('orders.export') && (
                            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <FaDownload className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <OrdersFilters
                    filters={params.filters || {}}
                    onFiltersChange={handleFiltersChange}
                    isLoading={isLoading}
                />

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <OrdersTable
                        orders={ordersData?.data || []}
                        pagination={ordersData?.pagination}
                        isLoading={isLoading}
                        onOrderSelect={handleOrderSelect}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        currentSort={params.sort}
                    />
                </div>

                {/* Order Details Modal */}
                {selectedOrder && (
                    <OrderDetailsModal
                        orderId={selectedOrder}
                        isOpen={!!selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
