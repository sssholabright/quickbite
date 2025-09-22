import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { MenuAddOn, MenuItem } from '../../types/menu'
import { useCreateMenuItem, useUpdateMenuItem, useCategories } from '../../hooks/useMenu'
import { FaTimes, FaArrowLeft, FaArrowRight, FaCheck, FaImage, FaPlus, FaTrash, FaCamera } from 'react-icons/fa'
import { FaSpinner } from 'react-icons/fa'
import { showConfirm } from '../../utils/sweetAlert'

interface AddMenuItemModalProps {
    isOpen: boolean
    onClose: () => void
    editingItem?: MenuItem | null
}

interface FormData {
    name: string
    description: string
    price: number
    image: string
    categoryId: string
    preparationTime: number
    addOns: MenuAddOn[]
}

export default function AddMenuItemModal({ isOpen, onClose, editingItem }: AddMenuItemModalProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [imagePreview, setImagePreview] = useState<string>('')
    
    // React Query hooks
    const createMenuItem = useCreateMenuItem()
    const updateMenuItem = useUpdateMenuItem()
    const { data: categories = [] } = useCategories()

    const { register, handleSubmit, formState: { errors, isDirty }, watch, setValue, reset } = useForm<FormData>({
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            image: '',
            categoryId: '',
            preparationTime: 15,
            addOns: []
        }
    })

    const watchedAddOns = watch('addOns')

    // Reset form when editingItem changes
    useEffect(() => {
        if (editingItem) {
            setValue('name', editingItem.name, { shouldDirty: false })
            setValue('description', editingItem.description || '', { shouldDirty: false })
            setValue('price', editingItem.price, { shouldDirty: false })
            setValue('image', editingItem.image || '', { shouldDirty: false })
            setValue('categoryId', editingItem.category?.id || '', { shouldDirty: false })
            setValue('preparationTime', editingItem.preparationTime || 15, { shouldDirty: false })
            setValue('addOns', editingItem.addOns || [], { shouldDirty: false })
            
            if (editingItem.image) {
                setImagePreview(editingItem.image)
            }
        } else {
            reset()
            setImagePreview('')
        }
    }, [editingItem, setValue, reset])

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
                setValue('image', e.target?.result as string, { shouldDirty: true, shouldValidate: true })
            }
            reader.readAsDataURL(file)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: 1
    })

    const addAddOn = () => {
        const newAddOn: MenuAddOn = {
            id: Date.now().toString(),
            name: '',
            description: '',
            price: 0,
            isRequired: false,
            maxQuantity: 1,
            category: 'EXTRA'
        }
        setValue('addOns', [...watchedAddOns, newAddOn], { shouldDirty: true, shouldValidate: true })
    }

    const removeAddOn = async (index: number) => {
        const confirmed = await showConfirm(
            'Remove add-on?',
            'Are you sure you want to remove this add-on?',
            'Remove',
            'Cancel'
        )
        if (!confirmed) return

        const updatedAddOns = watchedAddOns.filter((_, i) => i !== index)
        setValue('addOns', updatedAddOns, { shouldDirty: true, shouldValidate: true })
    }

    const updateAddOn = (index: number, field: keyof MenuAddOn, value: any) => {
        const updatedAddOns = watchedAddOns.map((addOn, i) => 
        i === index ? { ...addOn, [field]: value } : addOn
    )
    setValue('addOns', updatedAddOns, { shouldDirty: true, shouldValidate: true })
    }

    const onSubmit = async (data: FormData) => {
        try {
            // If editing and nothing changed, ask once to close without saving
            if (editingItem && !isDirty) {
                const closeNoChanges = await showConfirm(
                    'No changes detected',
                    'Close without saving?',
                    'Close',
                    'Stay'
                )
                if (closeNoChanges) {
                    handleClose(true)
                }
                return
            }

            // Confirm action
            const confirmed = await showConfirm(
                editingItem ? 'Update Menu Item' : 'Add Menu Item',
                editingItem ? 'Are you sure you want to update this item?' : 'Are you sure you want to add this item?',
                editingItem ? 'Yes, update' : 'Yes, add',
                'Cancel'
            )
            if (!confirmed) return

            // Convert addOns to the format expected by the API
            const addOnsData = data.addOns.map(addOn => ({
                name: addOn.name,
                description: addOn.description,
                price: Number(addOn.price),
                isRequired: addOn.isRequired,
                maxQuantity: addOn.maxQuantity,
                category: addOn.category
            }))

            if (!data.categoryId) {
                console.error('Category is required')
                return
            }

            if (editingItem) {
                await updateMenuItem.mutateAsync({
                    id: editingItem.id,
                    data: {
                        name: data.name,
                        description: data.description,
                        price: Number(data.price),
                        image: data.image,
                        categoryId: data.categoryId,
                        preparationTime: Number(data.preparationTime),
                        addOns: addOnsData
                    }
                })
            } else {
                await createMenuItem.mutateAsync({
                    name: data.name,
                    description: data.description,
                    price: Number(data.price),
                    image: data.image,
                    categoryId: data.categoryId,
                    preparationTime: Number(data.preparationTime),
                    addOns: addOnsData
                })
            }

            // Close silently after success
            handleClose(true)
        } catch (error) {
            // handled by mutation
        }
    }

    const handleClose = async (silent?: boolean) => {
        if (!silent) {
            const hasChanges = isDirty || !!imagePreview || (watch('addOns')?.length > (editingItem?.addOns?.length || 0))
            if (hasChanges) {
                const confirmed = await showConfirm(
                    'Discard changes?',
                    'Any unsaved changes will be lost.',
                    'Discard',
                    'Stay'
                )
                if (!confirmed) return
            }
        }
        reset()
        setCurrentStep(1)
        setImagePreview('')
        onClose()
    }

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    if (!isOpen) return null

    const isEditing = !!editingItem
    const isLoading = createMenuItem.isPending || updateMenuItem.isPending

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
                        </h2>
                        <button
                            onClick={() => handleClose()}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mt-4 space-x-4">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    currentStep >= step 
                                        ? 'bg-white text-primary-600' 
                                        : 'bg-primary-500 text-white'
                                }`}>
                                    {currentStep > step ? <FaCheck /> : step}
                                </div>
                                {step < 4 && (
                                    <div className={`w-8 h-0.5 mx-2 ${
                                        currentStep > step ? 'bg-white' : 'bg-primary-500'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    {...register('name', { required: 'Item name is required' })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter item name"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter item description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price (₦) *
                                    </label>
                                    <input
                                        {...register('price', { 
                                            required: 'Price is required',
                                            min: { value: 0, message: 'Price must be positive' },
                                            valueAsNumber: true
                                        })}
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                    {errors.price && (
                                        <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preparation Time (minutes) *
                                    </label>
                                    <input
                                        {...register('preparationTime', { 
                                            required: 'Preparation time is required',
                                            min: { value: 1, message: 'Must be at least 1 minute' },
                                            max: { value: 120, message: 'Must be less than 120 minutes' },
                                            valueAsNumber: true
                                        })}
                                        type="number"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="15"
                                    />
                                    {errors.preparationTime && (
                                        <p className="text-red-500 text-sm mt-1">{errors.preparationTime.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    {...register('categoryId', { required: 'Category is required' })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Image Upload */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Item Image</h3>
                            
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    isDragActive 
                                        ? 'border-primary-500 bg-primary-50' 
                                        : 'border-gray-300 hover:border-primary-400'
                                }`}
                            >
                                <input {...getInputProps()} />
                                
                                {imagePreview ? (
                                    <div className="space-y-4">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="mx-auto max-h-48 rounded-lg shadow-md"
                                        />
                                        <p className="text-sm text-gray-600">Click or drag to change image</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <FaCamera className="text-gray-400 text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-gray-700">
                                                {isDragActive ? 'Drop the image here' : 'Upload item image'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Drag & drop or click to select
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-gray-500">
                                <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                                <p>Max file size: 5MB</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Add-ons */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-800">Add-ons & Extras</h3>
                                <button
                                    type="button"
                                    onClick={addAddOn}
                                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <FaPlus size={16} />
                                    <span>Add Option</span>
                                </button>
                            </div>

                            {watchedAddOns.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FaImage className="mx-auto text-4xl mb-4 text-gray-300" />
                                    <p>No add-ons added yet</p>
                                    <p className="text-sm">Click "Add Option" to create extras like extra rice, extra meat, etc.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {watchedAddOns.map((addOn, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-gray-800">Add-on #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAddOn(index)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Name *
                                                    </label>
                                                    <input
                                                        value={addOn.name}
                                                        onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                        placeholder="e.g., Extra Rice"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Category
                                                    </label>
                                                    <select
                                                        value={addOn.category}
                                                        onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    >
                                                        <option value="EXTRA">Extra</option>
                                                        <option value="SIZE">Size</option>
                                                        <option value="SIDE">Side</option>
                                                        <option value="CUSTOMIZATION">Customization</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <input
                                                    value={addOn.description}
                                                    onChange={(e) => updateAddOn(index, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="Optional description"
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Price (₦) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={addOn.price}
                                                        onChange={(e) => updateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Max Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={addOn.maxQuantity}
                                                        onChange={(e) => updateAddOn(index, 'maxQuantity', parseInt(e.target.value) || 1)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="flex items-center">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={addOn.isRequired}
                                                            onChange={(e) => updateAddOn(index, 'isRequired', e.target.checked)}
                                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Required</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Preview */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Preview & Confirm</h3>
                            
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-start space-x-4">
                                    {imagePreview && (
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-800">{watch('name')}</h4>
                                        <p className="text-gray-600 text-sm mt-1">{watch('description')}</p>
                                        <div className="flex items-center space-x-4 mt-2">
                                            <span className="text-2xl font-bold text-primary-600">₦{watch('price')}</span>
                                            <span className="text-sm text-gray-500">{watch('preparationTime')} min</span>
                                        </div>
                                    </div>
                                </div>

                                {watchedAddOns.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h5 className="font-medium text-gray-800 mb-2">Available Add-ons:</h5>
                                        <div className="space-y-2">
                                            {watchedAddOns.map((addOn, index) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">{addOn.name}</span>
                                                    <span className="font-medium">₦{addOn.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                                currentStep === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <FaArrowLeft size={16} />
                            <span>Previous</span>
                        </button>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => handleClose()}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <span>Next</span>
                                    <FaArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <FaSpinner className="animate-spin" size={16} />
                                    ) : (
                                        <FaCheck size={16} />
                                    )}
                                    <span>{isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Item' : 'Add Item')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
