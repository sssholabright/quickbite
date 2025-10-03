import { useVendorDetails, useApproveVendor, useSuspendVendor, useRejectVendor, useBlockVendor, useActivateVendor } from '../../hooks/useVendors';
import Swal from 'sweetalert2';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaShoppingCart, FaStar, FaEdit, FaCheck, FaPause, FaBan, FaPlay } from 'react-icons/fa';
import { useAdminStore } from '../../stores/adminStore';

interface VendorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    onVendorEdit?: (vendorId: string) => void;
}

export default function VendorDetailsModal({ isOpen, onClose, vendorId, onVendorEdit }: VendorDetailsModalProps) {
    const { data: vendor, isLoading, error } = useVendorDetails(vendorId);
    const { hasPermission } = useAdminStore();
    const approveVendorMutation = useApproveVendor();
    const suspendVendorMutation = useSuspendVendor();
    const rejectVendorMutation = useRejectVendor();
    const blockVendorMutation = useBlockVendor();
    const activateVendorMutation = useActivateVendor();

    const canApprove = hasPermission('vendors.approve');
    const canSuspend = hasPermission('vendors.suspend');
    const canBlock = hasPermission('vendors.block');
    const canEdit = hasPermission('vendors.write');

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Suspended' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            BLOCKED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Blocked' }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve Vendor?',
            text: 'This will approve the vendor and allow them to receive orders.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await approveVendorMutation.mutateAsync(vendorId);
                Swal.fire({
                    icon: 'success',
                    title: 'Vendor Approved',
                    text: 'Vendor has been approved successfully.',
                    confirmButtonColor: '#059669'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Approval Failed',
                    text: error.message || 'Failed to approve vendor.',
                    confirmButtonColor: '#DC2626'
                });
            }
        }
    };

    const handleSuspend = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Suspend Vendor',
            text: 'Enter reason for suspension (optional):',
            input: 'text',
            inputPlaceholder: 'Reason for suspension...',
            showCancelButton: true,
            confirmButtonColor: '#F59E0B',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Suspend',
            cancelButtonText: 'Cancel'
        });

        if (reason !== undefined) {
            try {
                await suspendVendorMutation.mutateAsync({ vendorId, reason });
                Swal.fire({
                    icon: 'success',
                    title: 'Vendor Suspended',
                    text: 'Vendor has been suspended successfully.',
                    confirmButtonColor: '#F59E0B'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Suspension Failed',
                    text: error.message || 'Failed to suspend vendor.',
                    confirmButtonColor: '#DC2626'
                });
            }
        }
    };

    const handleReject = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Reject Vendor',
            text: 'Enter reason for rejection (optional):',
            input: 'text',
            inputPlaceholder: 'Reason for rejection...',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel'
        });

        if (reason !== undefined) {
            try {
                await rejectVendorMutation.mutateAsync({ vendorId, reason });
                Swal.fire({
                    icon: 'success',
                    title: 'Vendor Rejected',
                    text: 'Vendor has been rejected successfully.',
                    confirmButtonColor: '#DC2626'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Rejection Failed',
                    text: error.message || 'Failed to reject vendor.',
                    confirmButtonColor: '#DC2626'
                });
            }
        }
    };

    const handleBlock = async () => {
        const { value: reason } = await Swal.fire({
            title: 'Block Vendor',
            text: 'This action is permanent. Enter reason for blocking (optional):',
            input: 'text',
            inputPlaceholder: 'Reason for blocking...',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Block Permanently',
            cancelButtonText: 'Cancel'
        });

        if (reason !== undefined) {
            try {
                await blockVendorMutation.mutateAsync({ vendorId, reason });
                Swal.fire({
                    icon: 'success',
                    title: 'Vendor Blocked',
                    text: 'Vendor has been blocked permanently.',
                    confirmButtonColor: '#DC2626'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Blocking Failed',
                    text: error.message || 'Failed to block vendor.',
                    confirmButtonColor: '#DC2626'
                });
            }
        }
    };

    const handleActivate = async () => {
        const result = await Swal.fire({
            title: 'Activate Vendor?',
            text: 'This will reactivate the vendor and allow them to receive orders again.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Activate',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await activateVendorMutation.mutateAsync(vendorId);
                Swal.fire({
                    icon: 'success',
                    title: 'Vendor Activated',
                    text: 'Vendor has been activated successfully.',
                    confirmButtonColor: '#059669'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Activation Failed',
                    text: error.message || 'Failed to activate vendor.',
                    confirmButtonColor: '#DC2626'
                });
            }
        }
    };

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="bg-white rounded-lg p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-600">Loading vendor details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="bg-white rounded-lg p-8 text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendor</h3>
                        <p className="text-gray-600 mb-4">
                            {error instanceof Error ? error.message : 'Failed to load vendor details'}
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                {vendor.logo ? (
                                    <img
                                        className="h-12 w-12 rounded-full object-cover mr-4"
                                        src={vendor.logo}
                                        alt={vendor.businessName}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                                        <span className="text-lg font-medium text-gray-600">
                                            {vendor.businessName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {vendor.businessName}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Vendor Details
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {canEdit && onVendorEdit && (
                                    <button
                                        onClick={() => onVendorEdit(vendor.id)}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        <FaEdit className="w-4 h-4 mr-1" />
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-4 pb-4 sm:p-6 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.user.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaEnvelope className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.email}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaPhone className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Phone:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.phone}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaBuilding className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Business:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.businessName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span className="ml-2">{getStatusBadge(vendor.status)}</span>
                                    </div>
                                    {vendor.description && (
                                        <div className="mt-3">
                                            <span className="text-sm text-gray-600">Description:</span>
                                            <p className="mt-1 text-sm text-gray-900">{vendor.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Performance & Location */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Performance & Location</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <FaShoppingCart className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Total Orders:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.performance.totalOrders}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaStar className="w-4 h-4 text-yellow-400 mr-2" />
                                        <span className="text-sm text-gray-600">Rating:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">{vendor.rating.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaClock className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Avg Prep Time:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">
                                            {vendor.performance.avgPrepTime ? `${vendor.performance.avgPrepTime.toFixed(0)}min` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-600">Completion Rate:</span>
                                        <span className="ml-2 text-sm font-medium text-gray-900">
                                            {vendor.performance.completionRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    {vendor.location.latitude && vendor.location.longitude && (
                                        <div className="flex items-start">
                                            <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                                            <div>
                                                <span className="text-sm text-gray-600">Location:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {vendor.location.address || 'Location set'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {vendor.location.latitude}, {vendor.location.longitude}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operating Hours */}
                            {vendor.operationalHours.openingTime && vendor.operationalHours.closingTime && (
                                <div className="lg:col-span-2">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h4>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <FaClock className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">Hours:</span>
                                            <span className="ml-2 text-sm font-medium text-gray-900">
                                                {vendor.operationalHours.openingTime} - {vendor.operationalHours.closingTime}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">Days:</span>
                                            <span className="ml-2 text-sm font-medium text-gray-900">
                                                {vendor.operationalHours.operatingDays.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <div className="flex flex-wrap gap-2">
                            {vendor.status === 'PENDING' && canApprove && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={approveVendorMutation.isPending}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaCheck className="w-4 h-4 mr-1" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={rejectVendorMutation.isPending}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaBan className="w-4 h-4 mr-1" />
                                        Reject
                                    </button>
                                </>
                            )}
                            
                            {vendor.status === 'APPROVED' && canSuspend && (
                                <button
                                    onClick={handleSuspend}
                                    disabled={suspendVendorMutation.isPending}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaPause className="w-4 h-4 mr-1" />
                                    Suspend
                                </button>
                            )}
                            
                            {(vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED') && canEdit && (
                                <button
                                    onClick={handleActivate}
                                    disabled={activateVendorMutation.isPending}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaPlay className="w-4 h-4 mr-1" />
                                    Activate
                                </button>
                            )}
                            
                            {vendor.status !== 'BLOCKED' && canBlock && (
                                <button
                                    onClick={handleBlock}
                                    disabled={blockVendorMutation.isPending}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaBan className="w-4 h-4 mr-1" />
                                    Block
                                </button>
                            )}
                        </div>
                        
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
