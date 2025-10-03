import React, { useState } from 'react';
import { usePaymentsList } from '../hooks/usePayments';
import { PaymentFilters, PaymentSort } from '../types/payments';
import AdminLayout from '../components/layout/AdminLayout';
import PaymentsFilters from '../components/payments/PaymentsFilters';
import PaymentsTable from '../components/payments/PaymentsTable';
import PaymentDetailsModal from '../components/payments/PaymentDetailsModal';

const PaymentsPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filters, setFilters] = useState<PaymentFilters>({});
    const [sort, setSort] = useState<PaymentSort>({ field: 'createdAt', direction: 'desc' });
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

    const { data, isLoading, error, refetch } = usePaymentsList(page, limit, filters, sort);

    const handleFiltersChange = (newFilters: PaymentFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSort = (field: keyof PaymentSort['field'], direction: 'asc' | 'desc') => {
        setSort({ field: field as any, direction });
    };

    const handleRefresh = () => {
        refetch();
    };

    const handlePaymentSelect = (paymentId: string) => {
        setSelectedPaymentId(paymentId);
    };

    const handleCloseModal = () => {
        setSelectedPaymentId(null);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Payments</h2>
                    <p className="text-gray-600 mb-4">Failed to load payments data</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
                        <p className="mt-2 text-gray-600">
                            Monitor payment transactions, process refunds, and retry failed payments
                        </p>
                    </div>

                    {/* Summary Cards */}
                    {data?.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                ₦{data.summary.totalAmount.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Successful Payments</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                ₦{data.summary.successfulAmount.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                ₦{data.summary.pendingAmount.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Failed Payments</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                ₦{data.summary.failedAmount.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <PaymentsFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow">
                        <PaymentsTable
                            data={data?.data || []}
                            pagination={data?.pagination}
                            loading={isLoading}
                            onPageChange={handlePageChange}
                            onSort={handleSort}
                            onPaymentSelect={handlePaymentSelect}
                            onRefresh={handleRefresh}
                        />
                    </div>

                    {/* Payment Details Modal */}
                    {selectedPaymentId && (
                        <PaymentDetailsModal
                            paymentId={selectedPaymentId}
                            onClose={handleCloseModal}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default PaymentsPage;