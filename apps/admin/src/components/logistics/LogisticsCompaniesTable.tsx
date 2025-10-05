import React, { useState } from 'react';
import { LogisticsCompanyListItem, LogisticsCompaniesListParams } from '../../types/logistics';
import { useAdminStore } from '../../stores/adminStore';
import { 
    FaChevronUp, 
    FaChevronDown, 
    FaEye, 
    FaBuilding, 
    FaUsers,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaBan,
    FaCheckCircle,
    FaExclamationTriangle,
    FaEdit
} from 'react-icons/fa';
import EditCompanyModal from './EditCompanyModal';

interface LogisticsCompaniesTableProps {
    companies: LogisticsCompanyListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    isLoading: boolean;
    onCompanySelect: (companyId: string) => void;
    onPageChange: (page: number) => void;
    onSortChange: (field: string, direction: 'asc' | 'desc') => void;
    currentSort?: LogisticsCompaniesListParams['sort'];
    onCompanyEdit?: (companyId: string) => void;
}

export default function LogisticsCompaniesTable({
    companies,
    pagination,
    isLoading,
    onCompanySelect,
    onPageChange,
    onSortChange,
    currentSort,
    onCompanyEdit
}: LogisticsCompaniesTableProps) {
    const { hasPermission } = useAdminStore();
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const getRowNumber = (index: number) => {
        if (!pagination) return index + 1;
        return (pagination.page - 1) * pagination.limit + index + 1;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            ACTIVE: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
            SUSPENDED: { color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationTriangle },
            BLOCKED: { color: 'bg-red-100 text-red-800', icon: FaBan }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
        const IconComponent = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {status}
            </span>
        );
    };

    const handleSort = (field: string) => {
        if (!currentSort) return;
        
        const direction = currentSort.field === field && currentSort.direction === 'desc' ? 'asc' : 'desc';
        onSortChange(field, direction);
    };

    const getSortIcon = (field: string) => {
        if (!currentSort || currentSort.field !== field) {
            return <FaChevronUp className="w-3 h-3 opacity-30" />;
        }
        return currentSort.direction === 'asc' 
            ? <FaChevronUp className="w-3 h-3" />
            : <FaChevronDown className="w-3 h-3" />;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading companies...</span>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
                <div className="space-y-4 p-4">
                    {companies.map((company, index) => (
                        <div key={company.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {company.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        #{getRowNumber(index)}
                                    </div>
                                </div>
                                {getStatusBadge(company.status)}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-gray-600">
                                    <FaBuilding className="w-3 h-3 mr-2" />
                                    <span className="truncate">{company.contactPerson}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <FaUsers className="w-3 h-3 mr-2" />
                                    <span>{company.ridersCount} riders ({company.onlineRidersCount} online)</span>
                                </div>
                                <div className="text-gray-600">
                                    Earnings: {formatCurrency(company.totalEarnings)}
                                </div>
                                <div className="text-gray-500 text-xs">
                                    Created: {formatDate(company.createdAt)}
                                </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={() => onCompanySelect(company.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                                >
                                    <FaEye className="w-3 h-3 mr-1" />
                                    View Details
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCompanyId(company.id);
                                        setShowEditModal(true);
                                    }}
                                    disabled={!hasPermission('logistics.write')}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit Company"
                                >
                                    <FaEdit className="w-3 h-3 mr-1" />
                                    Edit
                                </button>
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
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                #
                            </th>
                            <th 
                                className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">
                                    Company Name
                                    {getSortIcon('name')}
                                </div>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact Person
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                            </th>
                            <th 
                                className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Riders
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Earnings
                            </th>
                            <th 
                                className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center">
                                    Created
                                    {getSortIcon('createdAt')}
                                </div>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companies.map((company, index) => (
                            <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 w-16">
                                    {getRowNumber(index)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                    <div className="text-sm text-gray-500">{company.email}</div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {company.contactPerson}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {company.phone}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(company.status)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center">
                                        <FaUsers className="w-3 h-3 mr-1 text-gray-400" />
                                        {company.ridersCount}
                                        {company.onlineRidersCount > 0 && (
                                            <span className="ml-1 text-xs text-green-600">
                                                ({company.onlineRidersCount} online)
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(company.totalEarnings)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(company.createdAt)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => onCompanySelect(company.id)}
                                        className="text-primary-600 hover:text-primary-900 transition-colors"
                                    >
                                        <FaEye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCompanyId(company.id);
                                            setShowEditModal(true);
                                        }}
                                        disabled={!hasPermission('logistics.write')}
                                        className="text-blue-600 hover:text-blue-900 transition-colors ml-3"
                                        title="Edit Company"
                                    >
                                        <FaEdit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, pagination.page - 2) + i;
                                    if (pageNum > pagination.totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
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
            {showEditModal && (
                <EditCompanyModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedCompanyId(null);
                    }}
                    company={companies.find(c => c.id === selectedCompanyId) || null}
                    onSuccess={() => {
                        setShowEditModal(false);
                    }}
                />
            )}
        </div>
    );
}