import React, { useState } from 'react';
import { RiderListItem, RiderSort } from '../../types/logistics';
import { useAdminStore } from '../../stores/adminStore';
import { 
    FaChevronUp, 
    FaChevronDown, 
    FaEye, 
    FaUser, 
    FaMotorcycle, 
    FaBuilding,
    FaPhone,
    FaDollarSign,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaCheckCircle,
    FaTimesCircle,
    FaBan,
    FaEdit
} from 'react-icons/fa';
import EditRiderModal from './EditRiderModal';

interface RidersTableProps {
    riders: RiderListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    isLoading: boolean;
    onRiderSelect: (riderId: string) => void;
    onPageChange: (page: number) => void;
    onSortChange: (sort: RiderSort) => void;
    currentSort: RiderSort;
    onRiderEdit?: (riderId: string) => void;
}

export default function RidersTable({
    riders,
    pagination,
    isLoading,
    onRiderSelect,
    onPageChange,
    onSortChange,
    currentSort,
    onRiderEdit
}: RidersTableProps) {
    const { hasPermission } = useAdminStore();
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

    const getRowNumber = (index: number) => {
        if (!pagination) return index + 1;
        return (pagination.page - 1) * pagination.limit + index + 1;
    };

    const getStatusBadge = (status: string, isOnline: boolean) => {
        if (status === 'BLOCKED') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FaBan className="w-3 h-3 mr-1" />
                    Blocked
                </span>
            );
        }
        
        if (status === 'SUSPENDED') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <FaBan className="w-3 h-3 mr-1" />
                    Suspended
                </span>
            );
        }

        if (isOnline) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FaCheckCircle className="w-3 h-3 mr-1" />
                    Online
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <FaTimesCircle className="w-3 h-3 mr-1" />
                Offline
            </span>
        );
    };

    const handleSort = (field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status') => {
        const direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
        onSortChange({ field, direction });
    };

    const SortButton = ({ field, children }: { field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status'; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center space-x-1 text-left font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none"
        >
            <span>{children}</span>
            {currentSort.field === field ? (
                currentSort.direction === 'asc' ? (
                    <FaChevronUp className="w-3 h-3" />
                ) : (
                    <FaChevronDown className="w-3 h-3" />
                )
            ) : (
                <div className="w-3 h-3" />
            )}
        </button>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <FaSpinner className="w-8 h-8 animate-spin text-primary-600 mr-3" />
                <span className="text-gray-600">Loading riders...</span>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
                <div className="space-y-4 p-4">
                    {riders.map((rider, index) => (
                        <div key={rider.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {rider.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        #{getRowNumber(index)}
                                    </div>
                                </div>
                                {getStatusBadge(rider.status as string, rider.isOnline)}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FaPhone className="w-3 h-3 mr-2" />
                                    {rider.phone}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FaBuilding className="w-3 h-3 mr-2" />
                                    {rider.company?.name}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FaMotorcycle className="w-3 h-3 mr-2" />
                                    {rider.vehicleType}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FaDollarSign className="w-3 h-3 mr-2" />
                                    ₦{rider.earningsTotal?.toLocaleString() || '0'}
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => onRiderSelect(rider.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <FaEye className="w-3 h-3 mr-1" />
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedRiderId(rider.id);
                                        setShowEditModal(true);
                                    }}
                                    disabled={!hasPermission('riders.write')}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="name">Rider</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="isOnline">Online</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="vehicleType">Vehicle</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="status">Status</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="earnings">Earnings</SortButton>
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {riders.map((rider, index) => (
                            <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 w-16">
                                    {getRowNumber(index)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                <FaUser className="w-4 h-4 text-primary-600" />
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">
                                                {rider.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {rider.phone}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaBuilding className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            {rider.company?.name || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaMotorcycle className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            {rider.vehicleType}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(rider.status as string, rider.isOnline)}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaDollarSign className="w-4 h-4 text-green-500 mr-1" />
                                        <span className="text-sm font-medium text-gray-900">
                                            ₦{rider.earningsTotal?.toLocaleString() || '0'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-green-600">
                                            {rider.completedOrders || 0}
                                        </span>
                                        <span className="text-red-600">
                                            {rider.cancelledOrders || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onRiderSelect(rider.id)}
                                            className="text-primary-600 hover:text-primary-900 transition-colors"
                                            title="View Details"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedRiderId(rider.id);
                                                setShowEditModal(true);
                                            }}
                                            disabled={!hasPermission('riders.write')}
                                            className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Edit Rider"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
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
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
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
                <EditRiderModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedRiderId(null);
                    }}
                    rider={riders.find(r => r.id === selectedRiderId) as RiderListItem || null}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setSelectedRiderId(null);
                        onRiderEdit?.(selectedRiderId!);
                    }}
                />
            )}
        </div>
    );
}