import React, { useState } from 'react';
import { useLogisticsCompanyDetails, useSuspendLogisticsCompany, useActivateLogisticsCompany, useBlockLogisticsCompany } from '../../hooks/useLogistics';
import { useAdminStore } from '../../stores/adminStore';
import Swal from 'sweetalert2';
import { 
    FaTimes, 
    FaBuilding,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaUsers,
    FaSpinner,
    FaBan,
    FaCheckCircle,
    FaExclamationTriangle,
    FaEdit
} from 'react-icons/fa';
import EditCompanyModal from './EditCompanyModal';

interface CompanyDetailsModalProps {
    companyId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function CompanyDetailsModal({ companyId, isOpen, onClose }: CompanyDetailsModalProps) {
    const { hasPermission } = useAdminStore();
    const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
    const [showEditModal, setShowEditModal] = useState(false);

    // Fetch company details
    const { data: company, isLoading, error, refetch } = useLogisticsCompanyDetails(companyId, isOpen);

    // Mutations
    const suspendMutation = useSuspendLogisticsCompany();
    const activateMutation = useActivateLogisticsCompany();
    const blockMutation = useBlockLogisticsCompany();

    const getStatusColor = (status: string) => {
        const colors = {
            ACTIVE: 'text-green-600 bg-green-100',
            SUSPENDED: 'text-yellow-600 bg-yellow-100',
            BLOCKED: 'text-red-600 bg-red-100',
        };
        return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            ACTIVE: FaCheckCircle,
            SUSPENDED: FaExclamationTriangle,
            BLOCKED: FaBan,
        };
        const IconComponent = icons[status as keyof typeof icons] || FaCheckCircle;
        return <IconComponent className="w-4 h-4" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAction = async (action: 'suspend' | 'activate' | 'block', reason?: string) => {
        let result;
        
        try {
            if (action === 'suspend') {
                result = await Swal.fire({
                    title: 'Suspend Company?',
                    html: `
                        <div class="text-left">
                            <p class="mb-2">Are you sure you want to suspend <strong>${company?.name}</strong>?</p>
                            <p class="text-sm text-gray-600 mb-3">This will:</p>
                            <ul class="text-sm text-gray-600 list-disc list-inside mb-3">
                                <li>Set all riders offline</li>
                                <li>Prevent new riders from coming online</li>
                                <li>Block new order assignments</li>
                            </ul>
                            <textarea id="reason" class="w-full p-2 border rounded" placeholder="Reason for suspension (optional)"></textarea>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#F59E0B',
                    cancelButtonColor: '#6B7280',
                    confirmButtonText: 'Yes, Suspend',
                    cancelButtonText: 'Cancel',
                    reverseButtons: true,
                    preConfirm: () => {
                        const reasonInput = document.getElementById('reason') as HTMLTextAreaElement;
                        return reasonInput?.value || undefined;
                    }
                });
                
                if (result.isConfirmed) {
                    await suspendMutation.mutateAsync({
                        companyId,
                        reason: result.value
                    });
                }
            } else if (action === 'activate') {
                result = await Swal.fire({
                    title: 'Activate Company?',
                    text: `Are you sure you want to activate ${company?.name}? This will allow riders to come online again.`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#059669',
                    cancelButtonColor: '#6B7280',
                    confirmButtonText: 'Yes, Activate',
                    cancelButtonText: 'Cancel',
                    reverseButtons: true
                });
                
                if (result.isConfirmed) {
                    await activateMutation.mutateAsync(companyId);
                }
            } else if (action === 'block') {
                result = await Swal.fire({
                    title: 'Block Company?',
                    html: `
                        <div class="text-left">
                            <p class="mb-2">Are you sure you want to block <strong>${company?.name}</strong>?</p>
                            <p class="text-sm text-red-600 mb-3">This is a permanent action that will:</p>
                            <ul class="text-sm text-red-600 list-disc list-inside mb-3">
                                <li>Set all riders offline permanently</li>
                                <li>Block all future operations</li>
                                <li>Require admin intervention to reverse</li>
                            </ul>
                            <textarea id="reason" class="w-full p-2 border rounded" placeholder="Reason for blocking (optional)"></textarea>
                        </div>
                    `,
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonColor: '#DC2626',
                    cancelButtonColor: '#6B7280',
                    confirmButtonText: 'Yes, Block',
                    cancelButtonText: 'Cancel',
                    reverseButtons: true,
                    preConfirm: () => {
                        const reasonInput = document.getElementById('reason') as HTMLTextAreaElement;
                        return reasonInput?.value || undefined;
                    }
                });
                
                if (result.isConfirmed) {
                    await blockMutation.mutateAsync({
                        companyId,
                        reason: result.value
                    });
                }
            }

            if (result?.isConfirmed) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Action Completed',
                    text: `Company ${action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'blocked'} successfully.`,
                    confirmButtonColor: '#059669'
                });
                
                refetch();
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Action Failed',
                text: error.message || `Failed to ${action} company. Please try again.`,
                confirmButtonColor: '#DC2626'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full mx-4">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                                <h3 className="text-lg sm:text-xl leading-6 font-medium text-gray-900">
                                    Company Details
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {company?.name || 'Loading...'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'details'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="hidden sm:inline">Company Details</span>
                                <span className="sm:hidden">Details</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('actions')}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'actions'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Actions
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-96 sm:max-h-none overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading company details...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                                <p className="text-red-600">Failed to load company details</p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : company ? (
                            <>
                                {activeTab === 'details' ? (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Company Status */}
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">Company Status</h4>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(company.status)}`}>
                                                        {getStatusIcon(company.status)}
                                                        <span className="ml-1">{company.status}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Company Information */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                <FaBuilding className="w-4 h-4 mr-2" />
                                                Company Information
                                            </h4>
                                            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Company Name</p>
                                                        <p className="text-sm text-gray-900">{company.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Contact Person</p>
                                                        <p className="text-sm text-gray-900">{company.contactPerson}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Phone</p>
                                                        <p className="text-sm text-gray-900 flex items-center">
                                                            <FaPhone className="w-3 h-3 mr-1 flex-shrink-0" />
                                                            {company.phone}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Email</p>
                                                        <p className="text-sm text-gray-900 flex items-center">
                                                            <FaEnvelope className="w-3 h-3 mr-1 flex-shrink-0" />
                                                            {company.email}
                                                        </p>
                                                    </div>
                                                    {company.address && (
                                                        <div className="sm:col-span-2">
                                                            <p className="text-sm font-medium text-gray-700">Address</p>
                                                            <p className="text-sm text-gray-900 flex items-start">
                                                                <FaMapMarkerAlt className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                                {company.address}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                <FaUsers className="w-4 h-4 mr-2" />
                                                Company Timeline
                                            </h4>
                                            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                                <div className="space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="text-sm text-gray-700">Created</span>
                                                        <span className="text-sm text-gray-900">{formatDate(company.createdAt)}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="text-sm text-gray-700">Last Updated</span>
                                                        <span className="text-sm text-gray-900">{formatDate(company.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-medium text-gray-900">Company Actions</h4>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Suspend Company */}
                                            {hasPermission('logistics.write') && company.status === 'ACTIVE' && (
                                                <button 
                                                    onClick={() => handleAction('suspend')}
                                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <FaExclamationTriangle className="w-6 h-6 text-yellow-600 mb-2" />
                                                    <h5 className="font-medium text-gray-900">Suspend Company</h5>
                                                    <p className="text-sm text-gray-500">Temporarily suspend company operations</p>
                                                </button>
                                            )}

                                            {/* Activate Company */}
                                            {hasPermission('logistics.write') && company.status === 'SUSPENDED' && (
                                                <button 
                                                    onClick={() => handleAction('activate')}
                                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <FaCheckCircle className="w-6 h-6 text-green-600 mb-2" />
                                                    <h5 className="font-medium text-gray-900">Activate Company</h5>
                                                    <p className="text-sm text-gray-500">Reactivate company operations</p>
                                                </button>
                                            )}

                                            {/* Block Company */}
                                            {hasPermission('logistics.write') && company.status !== 'BLOCKED' && (
                                                <button 
                                                    onClick={() => handleAction('block')}
                                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <FaBan className="w-6 h-6 text-red-600 mb-2" />
                                                    <h5 className="font-medium text-gray-900">Block Company</h5>
                                                    <p className="text-sm text-gray-500">Permanently block company</p>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {showEditModal && (
                <EditCompanyModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    company={company || null}
                    onSuccess={() => {
                        refetch();
                        setShowEditModal(false);
                    }}
                />
            )}
        </div>
    );
}