import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import RidersFilters from '../components/riders/RidersFilters';
import CreateRiderModal from '../components/riders/CreateRiderModal';
import { useRidersList } from '../hooks/useRiders';
import { useAdminStore } from '../stores/adminStore';
import { RidersListParams, RiderSort } from '../types/logistics';
import { FaPlus, FaDownload, FaSyncAlt } from 'react-icons/fa';
import RidersTable from '../components/riders/RidersTable';
import RiderDetailsModal from '../components/riders/RiderDetailsModal';
import EditRiderModal from '../components/riders/EditRiderModal';

export default function RidersPage() {
    const { hasPermission } = useAdminStore();
    
    // State for filters and pagination
    const [params, setParams] = useState<RidersListParams>({
        page: 1,
        limit: 20,
        sort: { field: 'createdAt', direction: 'desc' }
    });
    
    // State for modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRider, setSelectedRider] = useState<string | null>(null);
    
    // Add state for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

    // Fetch riders data
    const { 
        data: ridersData, 
        isLoading, 
        isError, 
        error,
        refetch 
    } = useRidersList(params);

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

    const handleSortChange = (sort: RiderSort) => {
        setParams(prev => ({
            ...prev,
            sort
        }));
    };

    const handleRiderSelect = (riderId: string) => {
        setSelectedRider(riderId);
    };

    const handleRiderEdit = (riderId: string) => {
        // This will be called after successful edit to refresh data
        refetch();
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load riders</h3>
                        <p className="text-gray-600 mb-4">
                            {error?.message || 'Something went wrong while loading riders'}
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
                        <h1 className="text-2xl font-bold text-gray-900">Riders Management</h1>
                        <p className="text-gray-600">Manage riders across all logistics companies</p>
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
                        
                        {hasPermission('riders.write') && (
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FaPlus className="w-4 h-4 mr-2" />
                                Add Rider
                            </button>
                        )}

                        {hasPermission('riders.export') && (
                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <FaDownload className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <RidersFilters
                    filters={params.filters || {}}
                    onFiltersChange={handleFiltersChange}
                    isLoading={isLoading}
                />

                {/* Riders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <RidersTable
                        riders={ridersData?.data || []}
                        pagination={ridersData?.pagination}
                        isLoading={isLoading}
                        onRiderSelect={handleRiderSelect}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        currentSort={params.sort || { field: 'createdAt', direction: 'desc' }}
                        onRiderEdit={handleRiderEdit} // Add this line
                    />
                </div>

                {/* Modals */}
                {showCreateModal && (
                    <CreateRiderModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            refetch();
                            setShowCreateModal(false);
                        }}
                    />
                )}

                {selectedRider && (
                    <RiderDetailsModal
                        riderId={selectedRider}
                        isOpen={!!selectedRider}
                        onClose={() => setSelectedRider(null)}
                        onSuccess={() => {
                            refetch();
                            setSelectedRider(null);
                        }}
                    />
                )}

                {showEditModal && (
                    <EditRiderModal
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedRiderId(null);
                        }}
                        rider={ridersData?.data.find(r => r.id === selectedRiderId) || null}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setSelectedRiderId(null);
                            handleRiderEdit(selectedRiderId!);
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
