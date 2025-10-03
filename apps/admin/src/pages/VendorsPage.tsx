import React, { useState } from 'react';
import { useVendorsList } from '../hooks/useVendors';
import { VendorFilters, VendorSort } from '../types/vendors';
import { FaPlus, FaSync } from 'react-icons/fa';
import { useAdminStore } from '../stores/adminStore';
import VendorsFilters from '../components/vendors/VendorsFilters';
import VendorsTable from '../components/vendors/VendorsTable';
import CreateVendorModal from '../components/vendors/CreateVendorModal';
import AdminLayout from '../components/layout/AdminLayout';
import VendorDetailsModal from '../components/vendors/VendorDetailsModal';
import EditVendorModal from '../components/vendors/EditVendorModal';

export default function VendorsPage() {
    const { hasPermission } = useAdminStore();
    const [filters, setFilters] = useState<VendorFilters>({});
    const [sort, setSort] = useState<VendorSort>({
        field: 'createdAt',
        direction: 'desc'
    });
    const [page, setPage] = useState(1);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

    const limit = 20;
    const canCreate = hasPermission('vendors.write');

    const { 
        data: vendorsData, 
        isLoading, 
        error, 
        refetch 
    } = useVendorsList(page, limit, filters, sort);

    const handleFiltersChange = (newFilters: VendorFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    const handleSortChange = (newSort: VendorSort) => {
        setSort(newSort);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleVendorSelect = (vendorId: string) => {
        setSelectedVendorId(vendorId);
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        refetch();
    };

    const handleEditVendor = (vendorId: string) => {
        setEditingVendorId(vendorId);
        setShowEditModal(true);
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        setEditingVendorId(null);
        refetch();
    };

    const handleRefresh = () => {
        refetch();
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Vendors</h2>
                    <p className="text-gray-600 mb-4">
                        {error instanceof Error ? error.message : 'Failed to load vendors'}
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Vendors Management</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage vendor registrations, approvals, and performance
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-3">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaSync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                {canCreate && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                    >
                                        <FaPlus className="w-4 h-4 mr-2" />
                                        Create Vendor
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6">
                        <VendorsFilters
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow">
                        <VendorsTable
                            vendors={vendorsData?.data || []}
                            pagination={vendorsData?.pagination}
                            isLoading={isLoading}
                            sort={sort}
                            onSortChange={handleSortChange}
                            onPageChange={handlePageChange}
                            onVendorSelect={handleVendorSelect}
                            onVendorEdit={handleEditVendor}
                        />
                    </div>

                    {/* Modals */}
                    {showCreateModal && (
                        <CreateVendorModal
                            isOpen={showCreateModal}
                            onClose={() => setShowCreateModal(false)}
                            onSuccess={handleCreateSuccess}
                        />
                    )}

                    {selectedVendorId && (
                        <VendorDetailsModal
                            isOpen={!!selectedVendorId}
                            onClose={() => setSelectedVendorId(null)}
                            vendorId={selectedVendorId}
                            onVendorEdit={handleEditVendor}
                        />
                    )}

                    {showEditModal && editingVendorId && (
                        <EditVendorModal
                            isOpen={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setEditingVendorId(null);
                            }}
                            vendorId={editingVendorId}
                            onSuccess={handleEditSuccess}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
