import React, { useState } from 'react';
import { usePayoutsList, useWalletsList } from '../hooks/usePayouts';
import { PayoutFilters, PayoutSort } from '../types/payouts';
import AdminLayout from '../components/layout/AdminLayout';
import PayoutsFilters from '../components/payouts/PayoutsFilters';
import PayoutsTable from '../components/payouts/PayoutsTable';
import WalletsTable from '../components/payouts/WalletsTable';
import PayoutDetailsModal from '../components/payouts/PayoutDetailsModal';
import CreatePayoutModal from '../components/payouts/CreatePayoutModal';

const PayoutsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'payouts' | 'wallets'>('payouts');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filters, setFilters] = useState<PayoutFilters>({});
    const [sort, setSort] = useState<PayoutSort>({ field: 'createdAt', direction: 'desc' });
    const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: payoutsData, isLoading: payoutsLoading, error: payoutsError, refetch: refetchPayouts } = usePayoutsList(page, limit, filters, sort);
    const { data: walletsData, isLoading: walletsLoading, error: walletsError, refetch: refetchWallets } = useWalletsList(page, limit, undefined, {}, { field: 'currentBalance', direction: 'desc' });

    const handleFiltersChange = (newFilters: PayoutFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSort = (field: keyof PayoutSort['field'], direction: 'asc' | 'desc') => {
        setSort({ field: field as any, direction });
    };

    const handleRefresh = () => {
        if (activeTab === 'payouts') {
            refetchPayouts();
        } else {
            refetchWallets();
        }
    };

    const handlePayoutSelect = (payoutId: string) => {
        setSelectedPayoutId(payoutId);
    };

    const handleCloseModal = () => {
        setSelectedPayoutId(null);
        setShowCreateModal(false);
    };

    const error = activeTab === 'payouts' ? payoutsError : walletsError;
    const loading = activeTab === 'payouts' ? payoutsLoading : walletsLoading;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">Failed to load {activeTab} data</p>
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
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Payouts Management</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage vendor and rider payouts, view wallet balances, and process payments
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Payout
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {walletsData?.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Vendors</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {walletsData.summary.totalVendors}
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
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Riders</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {walletsData.summary.totalRiders}
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
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Balance</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                ₦{walletsData.summary.totalPendingBalance.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Eligible for Payout</dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {walletsData.summary.eligibleForPayout}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('payouts')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'payouts'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Payout History
                            </button>
                            <button
                                onClick={() => setActiveTab('wallets')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'wallets'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Wallets
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    {activeTab === 'payouts' ? (
                        <>
                            {/* Filters */}
                            <PayoutsFilters
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                            />

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow">
                                <PayoutsTable
                                    data={payoutsData?.data || []}
                                    pagination={payoutsData?.pagination}
                                    loading={loading}
                                    onPageChange={handlePageChange}
                                    onSort={handleSort}
                                    onPayoutSelect={handlePayoutSelect}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-lg shadow">
                            <WalletsTable
                                data={walletsData?.data || []}
                                pagination={walletsData?.pagination}
                                loading={loading}
                                onPageChange={handlePageChange}
                                onRefresh={handleRefresh}
                            />
                        </div>
                    )}

                    {/* Modals */}
                    {selectedPayoutId && (
                        <PayoutDetailsModal
                            payoutId={selectedPayoutId}
                            onClose={handleCloseModal}
                        />
                    )}

                    {showCreateModal && (
                        <CreatePayoutModal
                            onClose={handleCloseModal}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default PayoutsPage;