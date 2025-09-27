export interface MenuAddOn {
    id: string
    name: string
    description?: string
    price: number
    isRequired: boolean
    maxQuantity: number
    category: 'EXTRA' | 'SIZE' | 'SIDE' | 'CUSTOMIZATION'
}

export interface MenuItem {
    id: string
    name: string
    description?: string
    price: number
    image?: string
    category: MenuCategory
    isAvailable: boolean
    preparationTime: number // in minutes
    addOns: MenuAddOn[]
    createdAt: string
    updatedAt: string
}

export interface MenuCategory {
    id: string
    name: string
    description?: string
    image?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface MenuFilters {
    search?: string
    categoryId?: string
    isAvailable?: boolean
    sortBy?: 'name' | 'price' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export interface MenuStats {
    totalItems: number
    availableItems: number
    unavailableItems: number
    totalCategories: number
    averagePrice: number
}

export interface CreateMenuItemData {
    name: string
    description?: string
    price: number
    image?: string
    categoryId: string
    preparationTime?: number
    addOns?: Omit<MenuAddOn, 'id'>[]
}

export interface UpdateMenuItemData {
    name?: string
    description?: string
    price?: number
    image?: string
    categoryId?: string
    isAvailable?: boolean
    preparationTime?: number
    addOns?: Omit<MenuAddOn, 'id'>[]
}

export interface CreateCategoryData {
    name: string
    description?: string
    image?: string
}