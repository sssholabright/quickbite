import { MenuItem } from '../../types/menu'
import { menuCategories } from '../../lib/mockMenu'
import { FaUtensils, FaEye, FaEyeSlash, FaDollarSign } from 'react-icons/fa'

interface MenuStatsProps {
    items: MenuItem[]
}

export default function MenuStats({ items }: MenuStatsProps) {
    const totalItems = items.length
    const availableItems = items.filter(item => item.isAvailable).length
    const unavailableItems = totalItems - availableItems
    
    const categoryStats = menuCategories.map(category => ({
        ...category,
        count: items.filter(item => item.category === category.id).length
    }))

    const averagePrice = items.length > 0 
        ? items.reduce((sum, item) => sum + item.price, 0) / items.length 
        : 0

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FaUtensils className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                </div>
            </div>

            {/* Available Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaEye className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Available</p>
                        <p className="text-2xl font-bold text-gray-900">{availableItems}</p>
                    </div>
                </div>
            </div>

            {/* Unavailable Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaEyeSlash className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Unavailable</p>
                        <p className="text-2xl font-bold text-gray-900">{unavailableItems}</p>
                    </div>
                </div>
            </div>

            {/* Average Price */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaDollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                        <p className="text-2xl font-bold text-gray-900">₦{Math.round(averagePrice).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="md:col-span-2 lg:col-span-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Items by Category</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categoryStats.map(category => (
                            <div key={category.id} className="text-center">
                                <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                    <span className="text-xl">{category.icon}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{category.count}</p>
                                <p className="text-xs text-gray-600">{category.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}