import { useState, useMemo } from 'react'
import { useMenuItems } from '../../hooks/useMenu'
import { MenuFilters as MenuFiltersType, MenuItem } from '../../types/menu'
import VendorLayout from '../../components/layout/VendorLayout'
import MenuItemCard from '../../components/menu/MenuItemCard'
import MenuFilters from '../../components/menu/MenuFilters'
import MenuStats from '../../components/menu/MenuStats'
import AddMenuItemModal from '../../components/menu/AddMenuItemModal'
import { FaPlus, FaFilter, FaUtensils } from 'react-icons/fa'

export default function MenuPage() {
    const [filters, setFilters] = useState<MenuFiltersType>({})
    const [showFilters, setShowFilters] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

    // React Query hooks
    const { 
        data: items = [], 
        isLoading, 
        error 
    } = useMenuItems(filters)

    // Group items by category
    const groupedItems = useMemo(() => {
        return items.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
            const cat = item.category?.name || 'Uncategorized'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(item)
            return acc
        }, {})
    }, [items])

    const handleFilterChange = (newFilters: MenuFiltersType) => {
        setFilters(newFilters)
    }

    const handleAddNew = () => {
        setEditingItem(null)
        setShowAddModal(true)
    }

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item)
        setShowAddModal(true)
    }

    const handleCloseModal = () => {
        setShowAddModal(false)
        setEditingItem(null)
    }

    return (
        <VendorLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                        <p className="mt-2 text-gray-600">Manage your restaurant menu items and categories</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(f => !f)}
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaFilter className="w-4 h-4 mr-2" />
                            Filters
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FaPlus className="w-4 h-4 mr-2" />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">
                            {error && 'response' in error ? (error as any).response?.data?.message : 'Failed to load menu items'}
                        </p>
                    </div>
                )}

                {/* Menu Statistics */}
                <MenuStats items={items} />

                {/* Filters */}
                {showFilters && (
                    <MenuFilters 
                        filters={filters}
                        onFiltersChange={handleFilterChange}
                    />
                )}

                {/* Menu Items */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className="space-y-8">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                            <div key={category}>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                    <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                                    {category} ({categoryItems.length} items)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {categoryItems.map(item => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUtensils className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
                        <p className="text-gray-600 mb-4">Start building your menu by adding your first item.</p>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors mx-auto"
                        >
                            <FaPlus className="w-4 h-4 mr-2" />
                            Add Your First Item
                        </button>
                    </div>
                )}

                {/* Add/Edit Item Modal */}
                <AddMenuItemModal 
                    isOpen={showAddModal} 
                    onClose={handleCloseModal}
                    editingItem={editingItem}
                />
            </div>
        </VendorLayout>
    )
}