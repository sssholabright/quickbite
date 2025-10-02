import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import LogisticsCompaniesTable from '../components/logistics/LogisticsCompaniesTable';
import LogisticsCompaniesFilters from '../components/logistics/LogisticsCompaniesFilters';
import CompanyDetailsModal from '../components/logistics/CompanyDetailsModal';
import { useLogisticsCompaniesList } from '../hooks/useLogistics';
import { useAdminStore } from '../stores/adminStore';
import { LogisticsCompaniesListParams } from '../types/logistics';
import { 
    FaPlus, 
    FaDownload,
    FaSyncAlt 
} from 'react-icons/fa';
import CreateCompanyModal from '../components/logistics/CreateCompanyModal';

export default function LogisticsPage() {
    const { hasPermission } = useAdminStore();
    
    // State for filters and pagination
    const [params, setParams] = useState<LogisticsCompaniesListParams>({
        page: 1,
        limit: 20,
        sort: { field: 'createdAt', direction: 'desc' }
    });
    
    // State for modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    
    // Fetch companies data
    const { 
        data: companiesData, 
        isLoading, 
        isError, 
        error,
        refetch 
    } = useLogisticsCompaniesList(params);

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

    const handleCompanySelect = (companyId: string) => {
        setSelectedCompany(companyId);
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load logistics companies</h3>
                        <p className="text-gray-600 mb-4">
                            {error?.message || 'Something went wrong while loading logistics companies'}
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
                        <h1 className="text-2xl font-bold text-gray-900">Logistics Management</h1>
                        <p className="text-gray-600">Manage logistics companies and their riders</p>
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
                        
                        {hasPermission('logistics.write') && (
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FaPlus className="w-4 h-4 mr-2" />
                                Add Company
                            </button>
                        )}

                        {hasPermission('logistics.export') && (
                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <FaDownload className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <LogisticsCompaniesFilters
                    filters={params.filters || {}}
                    onFiltersChange={handleFiltersChange}
                    isLoading={isLoading}
                />

                {/* Companies Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <LogisticsCompaniesTable
                        companies={companiesData?.data || []}
                        pagination={companiesData?.pagination}
                        isLoading={isLoading}
                        onCompanySelect={handleCompanySelect}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        currentSort={params.sort}
                    />
                </div>

                {/* Modals */}
                {showCreateModal && (
                    <CreateCompanyModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            refetch();
                            setShowCreateModal(false);
                        }}
                    />
                )}

                {selectedCompany && (
                    <CompanyDetailsModal
                        companyId={selectedCompany}
                        isOpen={!!selectedCompany}
                        onClose={() => setSelectedCompany(null)}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
