import { useState, useMemo } from 'react'
import { useMenuItems } from '../../hooks/useMenu'
import { MenuFilters as MenuFiltersType, MenuItem } from '../../types/menu'
import VendorLayout from '../../components/layout/VendorLayout'
import MenuItemCard from '../../components/menu/MenuItemCard'
import MenuFilters from '../../components/menu/MenuFilters'
import MenuStats from '../../components/menu/MenuStats'
import AddMenuItemModal from '../../components/menu/AddMenuItemModal'
import { FaPlus, FaFilter, FaUtensils, FaSearch, FaChevronDown, FaChevronUp, FaList, FaSort, FaGripVertical } from 'react-icons/fa'
import Pagination from '../../components/ui/Pagination'

export default function MenuPage() {
    const [filters, setFilters] = useState<MenuFiltersType>({})
    const [showFilters, setShowFilters] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(12)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    // React Query hooks
    const { 
        data: menuData, 
        isLoading, 
        error 
    } = useMenuItems({ ...filters, page: currentPage, limit: itemsPerPage })

    const items = menuData?.items || []
    const totalItems = menuData?.total || 0

    // Filter items by search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items
        
        return items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof item.category === 'string' ? item.category : item.category?.name)?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [items, searchQuery])

    // Group items by category
    const groupedItems = useMemo(() => {
        return filteredItems.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
            const cat = item.category?.name || 'Uncategorized'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(item)
            return acc
        }, {})
    }, [filteredItems])

    const handleFilterChange = (newFilters: MenuFiltersType) => {
        setFilters(newFilters)
        setCurrentPage(1)
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <VendorLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <FaUtensils className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Menu Management
                                    </h1>
                                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage your restaurant menu items</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className="lg:hidden flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all duration-200 shadow-lg"
                                >
                                    <FaFilter className="w-4 h-4" />
                                    <span className="font-medium">Filters</span>
                                    {showMobileFilters ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                                </button>

                                {/* Desktop Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="hidden lg:flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                                >
                                    <FaFilter className="w-4 h-4" />
                                    <span className="font-medium">Filters</span>
                                </button>

                                {/* Add Item Button */}
                                <button
                                    onClick={handleAddNew}
                                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    <span className="font-medium">Add Item</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                                />
                            </div>
                            
                            {/* View Mode Toggle */}
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        viewMode === 'grid' 
                                            ? 'bg-white text-primary-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="Grid view"
                                >
                                    <FaGripVertical className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        viewMode === 'list' 
                                            ? 'bg-white text-primary-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="List view"
                                >
                                    <FaList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                    <FaUtensils className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900">Failed to load menu</h3>
                                    <p className="text-red-700">
                                        {error && 'response' in error ? (error as any).response?.data?.message : 'Failed to load menu items'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Menu Statistics */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <MenuStats items={items} />
                    </div>

                    {/* Mobile Filters */}
                    {showMobileFilters && (
                        <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <MenuFilters 
                                filters={filters}
                                onFiltersChange={handleFilterChange}
                            />
                        </div>
                    )}

                    {/* Desktop Filters */}
                    {showFilters && (
                        <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <MenuFilters 
                                filters={filters}
                                onFiltersChange={handleFilterChange}
                            />
                        </div>
                    )}

                    {/* Menu Items */}
                    {isLoading ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-gray-50 rounded-2xl animate-pulse">
                                        <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            <div className="flex space-x-2">
                                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="space-y-8">
                            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                                <div key={category} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                                            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                    
                                    <div className={`grid gap-6 ${
                                        viewMode === 'grid' 
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                            : 'grid-cols-1'
                                    }`}>
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
                            
                            {/* Pagination */}
                            {menuData && totalItems > itemsPerPage && (
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(totalItems / itemsPerPage)}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <FaUtensils className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No menu items found</h3>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                {searchQuery ? 'No items match your search criteria. Try adjusting your search or filters.' : 'Start building your menu by adding your first item.'}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Clear Search
                                    </button>
                                )}
                                <button
                                    onClick={handleAddNew}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                >
                                    <FaPlus className="w-5 h-5" />
                                    <span>Add Your First Item</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add/Edit Item Modal */}
                    <AddMenuItemModal 
                        isOpen={showAddModal} 
                        onClose={handleCloseModal}
                        editingItem={editingItem}
                    />
                </div>
            </div>
        </VendorLayout>
    )
}