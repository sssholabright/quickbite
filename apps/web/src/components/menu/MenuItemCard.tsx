import { useState } from 'react'
import { MenuItem } from '../../types/menu'
import { useDeleteMenuItem, useToggleMenuItemAvailability } from '../../hooks/useMenu'
import { showConfirm } from '../../utils/sweetAlert'
import { formatNaira } from '../../lib/mockMenu'
import { 
    FaEdit, 
    FaTrash, 
    FaToggleOn, 
    FaToggleOff, 
    FaClock,
    FaEye,
    FaEyeSlash
} from 'react-icons/fa'

interface MenuItemCardProps {
    item: MenuItem
    onEdit?: (item: MenuItem) => void
}

export default function MenuItemCard({ item, onEdit }: MenuItemCardProps) {
    const [isLoading, setIsLoading] = useState(false)
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
        try {
            await toggleAvailability.mutateAsync(item.id)
        } catch (error) {
            // Error is handled by the mutation hook
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            'Delete Menu Item',
            `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            'Delete',
            'Cancel'
        )
        if (confirmed) {
            setIsLoading(true)
            try {
                await deleteMenuItem.mutateAsync(item.id)
            } catch (error) {
                // Error is handled by the mutation hook
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleEditClick = async () => {
        if (!onEdit) return
        const confirmed = await showConfirm(
            'Edit Menu Item',
            `Do you want to edit "${item.name}"?`,
            'Yes, edit',
            'Cancel'
        )
        if (!confirmed) return
        onEdit(item)
    }

    const getCategoryColor = (category: string) => {
        switch (category?.toUpperCase()) {
            case 'MEALS': return 'bg-orange-100 text-orange-800'
            case 'DRINKS': return 'bg-blue-100 text-blue-800'
            case 'SNACKS': return 'bg-yellow-100 text-yellow-800'
            case 'DESSERTS': return 'bg-pink-100 text-pink-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
            item.isAvailable ? 'border-gray-200' : 'border-red-200 bg-red-50'
        }`}>
            {/* Image */}
            <div className="relative">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-xl"
                    />
                ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-t-xl">
                        <FaEyeSlash className="text-4xl text-gray-300" />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(typeof item.category === 'string' ? item.category : item.category?.name || '')}`}>
                    {typeof item.category === 'string' ? item.category : item.category?.name}
                </span>
                </div>
                <div className="absolute top-3 right-3">
                    <button
                        onClick={handleToggleAvailability}
                        disabled={isLoading || toggleAvailability.isPending}
                        className={`p-2 rounded-full transition-colors ${
                            item.isAvailable 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                    >
                        {item.isAvailable ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                    <span className="text-xl font-bold text-primary-600">{formatNaira(item.price)}</span>
                </div>
                
                {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                        <FaClock className="w-4 h-4 mr-1" />
                        {item.preparationTime} min
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>

                 {/* Add-ons */}
                 {item.addOns && item.addOns.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Add-ons available:</p>
                        <div className="flex flex-wrap gap-1">
                            {item.addOns.slice(0, 3).map((addOn, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full"
                                >
                                    {addOn.name}
                                </span>
                            ))}
                            {item.addOns.length > 3 && (
                                <span className="text-xs text-gray-500">
                                    +{item.addOns.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleEditClick}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4 mr-1" />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isLoading || deleteMenuItem.isPending}
                            className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaTrash className="w-4 h-4 mr-1" />
                            Delete
                        </button>
                    </div>
                    
                    <button
                        onClick={handleToggleAvailability}
                        disabled={isLoading || toggleAvailability.isPending}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                            item.isAvailable
                                ? 'text-green-600 hover:text-green-900 hover:bg-green-100'
                                : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                        }`}
                    >
                        {item.isAvailable ? <FaToggleOn className="w-4 h-4 mr-1" /> : <FaToggleOff className="w-4 h-4 mr-1" />}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    )
}