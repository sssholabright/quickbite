import { MenuItem } from '../../types/menu'
import { useDeleteMenuItem, useToggleMenuItemAvailability } from '../../hooks/useMenu'
import { showConfirm, showError, showSuccess } from '../../utils/sweetAlert'
import { formatNaira } from '../../lib/mockMenu'
import { 
    FaEdit, 
    FaTrash, 
    FaToggleOn, 
    FaToggleOff, 
    FaClock,
    FaEye,
    FaEyeSlash,
    FaSpinner,
    FaExclamationTriangle,
    FaCheckCircle,
    FaImage,
    FaPlus
} from 'react-icons/fa'
import { useState } from 'react'

interface MenuItemCardProps {
    item: MenuItem
    onEdit?: (item: MenuItem) => void
}

export default function MenuItemCard({ item, onEdit }: MenuItemCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [actionType, setActionType] = useState<'toggle' | 'delete' | 'edit' | null>(null)
    const deleteMenuItem = useDeleteMenuItem()
    const toggleAvailability = useToggleMenuItemAvailability()

    const handleToggleAvailability = async () => {
        const confirmed = await showConfirm(
            item.isAvailable ? 'Mark as Unavailable' : 'Mark as Available',
            `Are you sure you want to mark "${item.name}" as ${item.isAvailable ? 'unavailable' : 'available'}?`,
            'Yes, proceed',
            'Cancel'
        )
        if (!confirmed) return

        setIsLoading(true)
        setActionType('toggle')
        try {
            await toggleAvailability.mutateAsync(item.id)
            showSuccess(
                'Success!',
                `"${item.name}" has been marked as ${!item.isAvailable ? 'available' : 'unavailable'}.`
            )
        } catch (error: any) {
            showError(
                'Failed to Update',
                error?.response?.data?.message || 'Failed to update menu item availability. Please try again.'
            )
        } finally {
            setIsLoading(false)
            setActionType(null)
        }
    }

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            'Delete Menu Item',
            `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            'Yes, Delete',
            'Cancel'
        )
        if (!confirmed) return

        setIsLoading(true)
        setActionType('delete')
        try {
            await deleteMenuItem.mutateAsync(item.id)
            showSuccess(
                'Deleted Successfully',
                `"${item.name}" has been deleted from your menu.`
            )
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to delete menu item. Please try again.'
            
            // Check if it's a foreign key constraint error
            if (errorMessage.includes('referenced by') || errorMessage.includes('active orders')) {
                showError(
                    'Cannot Delete Item',
                    `${errorMessage} Consider marking the item as unavailable instead.`
                )
            } else {
                showError(
                    'Delete Failed',
                    errorMessage
                )
            }
        } finally {
            setIsLoading(false)
            setActionType(null)
        }
    }

    const handleEditClick = async () => {
        if (!onEdit) return
        setActionType('edit')
        try {
            await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for UX
            onEdit(item)
        } finally {
            setActionType(null)
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category?.toUpperCase()) {
            case 'FOODS': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'DRINKS': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'SNACKS': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'DESSERTS': return 'bg-pink-100 text-pink-800 border-pink-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const isLoadingAction = isLoading && !!actionType
    const isToggleLoading = isLoadingAction && actionType === 'toggle'
    const isDeleteLoading = isLoadingAction && actionType === 'delete'
    const isEditLoading = isLoadingAction && actionType === 'edit'

    return (
        <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
            item.isAvailable 
                ? 'border-gray-200 hover:border-primary-300' 
                : 'border-red-200 bg-red-50 hover:border-red-300'
        } ${isLoadingAction ? 'opacity-75 pointer-events-none' : ''}`}>
            {/* Image */}
            <div className="relative overflow-hidden">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-xl transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                        }}
                    />
                ) : null}
                
                {/* Fallback for missing/broken images */}
                <div className={`w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl ${item.image ? 'hidden' : ''}`}>
                    <div className="text-center">
                        <FaImage className="text-4xl text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No Image</p>
                    </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(typeof item.category === 'string' ? item.category : item.category?.name || '')}`}>
                        {typeof item.category === 'string' ? item.category : item.category?.name}
                    </span>
                </div>

                {/* Availability Toggle */}
                <div className="absolute top-3 right-3">
                    <button
                        onClick={handleToggleAvailability}
                        disabled={isLoadingAction}
                        className={`p-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
                            item.isAvailable 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                        } ${isToggleLoading ? 'animate-pulse' : ''}`}
                        title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                    >
                        {isToggleLoading ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : item.isAvailable ? (
                            <FaEye className="w-4 h-4" />
                        ) : (
                            <FaEyeSlash className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Loading Overlay */}
                {isLoadingAction && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-t-xl">
                        <div className="bg-white rounded-full p-3 shadow-lg">
                            <FaSpinner className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1 mr-2">{item.name}</h3>
                    <span className="text-xl font-bold text-primary-600 flex-shrink-0">{formatNaira(item.price)}</span>
                </div>
                
                {item.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center text-gray-500">
                        <FaClock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{item.preparationTime} min</span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        item.isAvailable 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>

                {/* Add-ons */}
                {item.addOns && item.addOns.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                            <FaPlus className="w-3 h-3 mr-1" />
                            Add-ons ({item.addOns.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {item.addOns.slice(0, 3).map((addOn, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full border border-primary-200 font-medium"
                                >
                                    {addOn.name}
                                </span>
                            ))}
                            {item.addOns.length > 3 && (
                                <span className="text-xs text-gray-500 font-medium px-2.5 py-1 bg-gray-100 rounded-full border border-gray-200">
                                    +{item.addOns.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleEditClick}
                            disabled={isLoadingAction}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isEditLoading 
                                    ? 'text-gray-400 bg-gray-100' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            {isEditLoading ? (
                                <FaSpinner className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <FaEdit className="w-4 h-4 mr-1" />
                            )}
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isLoadingAction || !isDeleteLoading}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isDeleteLoading 
                                    ? 'text-red-400 bg-red-100' 
                                    : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                            }`}
                        >
                            {isDeleteLoading ? (
                                <FaSpinner className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <FaTrash className="w-4 h-4 mr-1" />
                            )}
                            Delete
                        </button>
                    </div>
                    
                    <button
                        onClick={handleToggleAvailability}
                        disabled={isLoadingAction}
                        className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            item.isAvailable
                                ? 'text-green-600 hover:text-green-900 hover:bg-green-100'
                                : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                        } ${isToggleLoading ? 'opacity-50' : ''}`}
                    >
                        {isToggleLoading ? (
                            <FaSpinner className="w-4 h-4 mr-1 animate-spin" />
                        ) : item.isAvailable ? (
                            <FaToggleOn className="w-4 h-4 mr-1" />
                        ) : (
                            <FaToggleOff className="w-4 h-4 mr-1" />
                        )}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    )
}