import React, { useEffect, useState } from 'react';
import { useCustomersList } from '../hooks/useCustomers';
import { CustomerFilters, CustomerSort } from '../types/customers';
import CustomersFilters from '../components/customers/CustomersFilters';
import CustomersTable from '../components/customers/CustomersTable';
import CustomerDetailsModal from '../components/customers/CustomerDetailsModal';
import AdminLayout from '../components/layout/AdminLayout';

const CustomersPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filters, setFilters] = useState<CustomerFilters>({});
    const [sort, setSort] = useState<CustomerSort>({ field: 'createdAt', direction: 'desc' });
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const { data, isLoading, error, refetch } = useCustomersList(page, limit, filters, sort);

    useEffect(() => {
        console.log("Customers: ", data)
    }, [data])

    const handleFiltersChange = (newFilters: CustomerFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSort = (field: keyof CustomerSort['field'], direction: 'asc' | 'desc') => {
        setSort({ field: field as any, direction });
    };

    const handleRefresh = () => {
        refetch();
    };

    const handleCustomerSelect = (customerId: string) => {
        setSelectedCustomerId(customerId);
    };

    const handleCloseModal = () => {
        setSelectedCustomerId(null);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Customers</h2>
                    <p className="text-gray-600 mb-4">Failed to load customers data</p>
                    <button
                        onClick={handleRefresh}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Customers Management</h1>
                        <p className="mt-2 text-gray-600">
                            Manage customer accounts, view order history, and handle customer issues
                        </p>
                    </div>

                    {/* Filters */}
                    <CustomersFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow">
                        <CustomersTable
                            data={data?.data || []}
                            pagination={data?.pagination}
                            loading={isLoading}
                            onPageChange={handlePageChange}
                            onSort={handleSort}
                            onCustomerSelect={handleCustomerSelect}
                            onRefresh={handleRefresh}
                        />
                    </div>

                    {/* Customer Details Modal */}
                    {selectedCustomerId && (
                        <CustomerDetailsModal
                            customerId={selectedCustomerId}
                            onClose={handleCloseModal}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default CustomersPage;
