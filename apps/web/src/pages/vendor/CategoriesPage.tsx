import { useState } from 'react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useMenu'
import VendorLayout from '../../components/layout/VendorLayout'
import { showConfirm, showSuccess, showError } from '../../utils/sweetAlert'
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaTags, FaChevronRight } from 'react-icons/fa'

export default function CategoriesPage() {
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: ''
    })

    // React Query hooks
    const { data: categories = [], isLoading } = useCategories()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const deleteCategory = useDeleteCategory()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name.trim()) {
            showError('Validation Error', 'Category name is required')
            return
        }

        // 🚀 NEW: Add confirmation dialog for create/edit
        const isEditing = !!editingCategory
        const categoryName = formData.name.trim()
        
        let confirmTitle: string
        let confirmMessage: string
        let confirmButtonText: string

        if (isEditing) {
            confirmTitle = 'Update Category'
            confirmMessage = `Are you sure you want to update "${editingCategory.name}" to "${categoryName}"?`
            confirmButtonText = 'Yes, Update'
        } else {
            confirmTitle = 'Create Category'
            confirmMessage = `Are you sure you want to create a new category called "${categoryName}"?`
            confirmButtonText = 'Yes, Create'
        }
        
        const confirmed = await showConfirm(
            confirmTitle,
            confirmMessage,
            confirmButtonText,
            'Cancel'
        )

        if (!confirmed) {
            return
        }

        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({
                    id: editingCategory.id,
                    data: formData
                })
                showSuccess('Category Updated', `"${formData.name}" has been updated successfully`)
            } else {
                await createCategory.mutateAsync({
                    data: formData
                })
                showSuccess('Category Created', `"${formData.name}" has been created successfully`)
            }
            
            handleClose()
        } catch (error: any) {
            const action = isEditing ? 'update' : 'create'
            showError('Error', error?.response?.data?.message || `Failed to ${action} category. Please try again.`)
        }
    }

    const handleEdit = (category: any) => {
        setEditingCategory(category)
        setFormData({
            name: category.name
        })
        setShowAddModal(true)
    }

    const handleDelete = async (category: any) => {
        const confirmed = await showConfirm(
            'Delete Category',
            `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
            'Delete',
            'Cancel'
        )

        if (confirmed) {
            try {
                await deleteCategory.mutateAsync(category.id)
                showSuccess('Category Deleted', `"${category.name}" has been deleted successfully`)
            } catch (error: any) {
                showError('Delete Failed', error?.response?.data?.message || 'Failed to delete category. Please try again.')
            }
        }
    }

    const handleClose = () => {
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({
            name: ''
        })
    }

    if (isLoading) {
        return (
            <VendorLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <FaTags className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600" size={20} />
                        </div>
                        <p className="text-gray-600 text-lg">Loading categories...</p>
                    </div>
                </div>
            </VendorLayout>
        )
    }

    return (
        <VendorLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto p-6 space-y-8">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FaTags className="text-white" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Menu Categories</h1>
                                    <p className="text-gray-600 mt-1">Organize your menu items into categories</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="group flex items-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <FaPlus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                                <span className="font-medium">Add Category</span>
                            </button>
                        </div>
                    </div>

                    {/* Categories Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {categories.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FaTags className="text-4xl text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No categories yet</h3>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    Categories help organize your menu items and make it easier for customers to find what they're looking for.
                                </p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                >
                                    Create Your First Category
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="px-8 py-6 border-b border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {categories.map((category, index) => (
                                        <div 
                                            key={category.id} 
                                            className="group px-8 py-6 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-200">
                                                        <span className="text-primary-700 font-semibold text-sm">
                                                            {category.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                                                            {category.name}
                                                        </h3>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    {!category.isActive && (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                                            title="Edit category"
                                                        >
                                                            <FaEdit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category)}
                                                            disabled={deleteCategory.isPending}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            title="Delete category"
                                                        >
                                                            <FaTrash size={16} />
                                                        </button>
                                                    </div>
                                                    <FaChevronRight className="text-gray-300 group-hover:text-primary-400 transition-colors duration-200" size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 rounded-t-3xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                            <FaTags size={18} />
                                        </div>
                                        <h2 className="text-2xl font-bold">
                                            {editingCategory ? 'Edit Category' : 'Create Category'}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all duration-200"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Category Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            placeholder="e.g., Appetizers, Main Courses, Desserts"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-6 py-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createCategory.isPending || updateCategory.isPending}
                                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                                    >
                                        {(createCategory.isPending || updateCategory.isPending) ? (
                                            <FaSpinner className="animate-spin" size={16} />
                                        ) : null}
                                        <span>
                                            {editingCategory ? 'Update Category' : 'Create Category'}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </VendorLayout>
    )
}