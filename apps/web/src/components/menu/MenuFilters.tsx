import { useState } from 'react'
import { MenuFilters as MenuFiltersType } from '../../types/menu'
import { menuCategories } from '../../lib/mockMenu'
import { FaSearch, FaTimes } from 'react-icons/fa'

interface MenuFiltersProps {
    filters: MenuFiltersType
    onFiltersChange: (filters: MenuFiltersType) => void
}

export default function MenuFilters({ filters, onFiltersChange }: MenuFiltersProps) {
    const [localFilters, setLocalFilters] = useState<MenuFiltersType>(filters)

    const handleFilterChange = (key: keyof MenuFiltersType, value: any) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const clearFilters = () => {
        const emptyFilters: MenuFiltersType = {}
        setLocalFilters(emptyFilters)
        onFiltersChange(emptyFilters)
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            value={localFilters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <FaSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Category Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                        value={localFilters.categoryId || ''}
                        onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        {menuCategories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Availability Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <select
                        value={localFilters.isAvailable === undefined ? 'all' : localFilters.isAvailable ? 'available' : 'unavailable'}
                        onChange={(e) => {
                            const value = e.target.value === 'all' ? undefined : e.target.value === 'available'
                            handleFilterChange('isAvailable', value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Items</option>
                        <option value="available">Available Only</option>
                        <option value="unavailable">Unavailable Only</option>
                    </select>
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                        value={localFilters.sortBy || 'name'}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="createdAt">Date Added</option>
                    </select>
                </div>

                {/* Sort Order */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                        value={localFilters.sortOrder || 'asc'}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={clearFilters}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Clear Filters
                </button>
            </div>
        </div>
    )
}