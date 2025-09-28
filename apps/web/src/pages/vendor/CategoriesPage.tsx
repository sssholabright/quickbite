import { useState } from 'react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useMenu'
import VendorLayout from '../../components/layout/VendorLayout'
import { showConfirm } from '../../utils/sweetAlert'
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa'

export default function CategoriesPage() {
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })

    // React Query hooks
    const { data: categories = [], isLoading } = useCategories()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const deleteCategory = useDeleteCategory()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name.trim()) {
            alert('Category name is required')
            return
        }

        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({
                    id: editingCategory.id,
                    data: formData
                })
            } else {
                await createCategory.mutateAsync({
                    data: formData
                })
            }
            
            handleClose()
        } catch (error) {
            // Error is handled by the mutation hook
        }
    }

    const handleEdit = (category: any) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            description: category.description || ''
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
            } catch (error) {
                // Error is handled by the mutation hook
            }
        }
    }

    const handleClose = () => {
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({
            name: '',
            description: ''
        })
    }

    if (isLoading) {
        return (
            <VendorLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading categories...</p>
                    </div>
                </div>
            </VendorLayout>
        )
    }

    return (
        <VendorLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-600 mt-1">Manage your menu categories</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
                    >
                        <FaPlus size={20} />
                        <span>Add Category</span>
                    </button>
                </div>

                {/* Categories Grid */}
                {categories.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaPlus className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-600 mb-6">Start by creating your first category</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Add Your First Category
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                {/* Category Info */}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {category.description}
                                        </p>
                                    )}
                                    
                                    {/* Status */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            category.isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(category.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <FaEdit size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            disabled={deleteCategory.isPending}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                        >
                                            <FaTrash size={14} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">
                                        {editingCategory ? 'Edit Category' : 'Add Category'}
                                    </h2>
                                    <button
                                        onClick={handleClose}
                                        className="text-white hover:text-gray-200 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter category name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter category description"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createCategory.isPending || updateCategory.isPending}
                                        className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                    >
                                        {(createCategory.isPending || updateCategory.isPending) ? (
                                            <FaSpinner className="animate-spin" size={16} />
                                        ) : null}
                                        <span>
                                            {editingCategory ? 'Update Category' : 'Add Category'}
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
