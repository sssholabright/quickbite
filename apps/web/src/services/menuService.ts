import api from './api'
import { MenuItem, MenuCategory, CreateMenuItemData, MenuFilters, UpdateMenuItemData, CreateCategoryData } from '../types/menu'

function logError(error: any, context: string) {
    console.error(`[MenuService] ${context}:`, error?.response?.data || error?.message || error)
}

export class MenuService {
    // Menu Items
    static async createMenuItem(data: CreateMenuItemData): Promise<MenuItem> {
        try {
            const response = await api.post('/menu/items', data)
            return response.data.data
        } catch (error) {
            logError(error, 'createMenuItem')
            throw error
        }
    }

    // Get menu items with pagination
    static async getMenuItems(filters?: MenuFilters): Promise<{ items: MenuItem[]; total: number; page: number; limit: number }> {
        try {
            const params = new URLSearchParams()
            
            if (filters?.search) params.append('search', filters.search)
            if (filters?.categoryId) params.append('categoryId', filters.categoryId)
            if (filters?.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString())
            if (filters?.sortBy) params.append('sortBy', filters.sortBy)
            if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
            if (filters?.page) params.append('page', filters.page.toString())
            if (filters?.limit) params.append('limit', filters.limit.toString())

            const response = await api.get(`/menu/items?${params.toString()}`)
            return {
                items: response.data.data.items.map(this.transformMenuItemResponse),
                total: response.data.data.total,
                page: response.data.data.page,
                limit: response.data.data.limit
            }
        } catch (error) {
            logError(error, 'getMenuItems')
            throw error
        }
    }

    static async getMenuItem(menuItemId: string): Promise<MenuItem> {
        try {
            const response = await api.get(`/menu/items/${menuItemId}`)
            return response.data.data
        } catch (error) {
            logError(error, 'getMenuItem')
            throw error
        }
    }

    static async updateMenuItem(menuItemId: string, data: UpdateMenuItemData): Promise<MenuItem> {
        try {
            const response = await api.put(`/menu/items/${menuItemId}`, data)
            return response.data.data
        } catch (error) {
            logError(error, 'updateMenuItem')
            throw error
        }
    }

    static async deleteMenuItem(menuItemId: string): Promise<void> {
        try {
            await api.delete(`/menu/items/${menuItemId}`)
        } catch (error) {
            logError(error, 'deleteMenuItem')
            throw error
        }
    }

    static async toggleMenuItemAvailability(menuItemId: string): Promise<MenuItem> {
        try {
            const response = await api.patch(`/menu/items/${menuItemId}/toggle-availability`)
            return response.data.data
        } catch (error) {
            logError(error, 'toggleMenuItemAvailability')
            throw error
        }
    }

    // Categories
    static async createCategory(data: CreateCategoryData): Promise<MenuCategory> {
        try {
            const response = await api.post('/menu/categories', data)
            return response.data.data
        } catch (error) {
            logError(error, 'createCategory')
            throw error
        }
    }

    static async getCategories(): Promise<MenuCategory[]> {
        try {
            const response = await api.get('/menu/categories')
            console.log("first: ", response)
            return response.data.data
        } catch (error) {
            logError(error, 'getCategories')
            throw error
        }
    }

    static async updateCategory(categoryId: string, data: Partial<CreateCategoryData>): Promise<MenuCategory> {
        try {
            const response = await api.put(`/menu/categories/${categoryId}`, data)
            return response.data.data
        } catch (error) {
            logError(error, 'updateCategory')
            throw error
        }
    }

    static async deleteCategory(categoryId: string): Promise<void> {
        try {
            await api.delete(`/menu/categories/${categoryId}`)
        } catch (error) {
            logError(error, 'deleteCategory')
            throw error
        }
    }

    private static transformMenuItemResponse(apiItem: any): MenuItem {
        return {
            id: apiItem.id,
            name: apiItem.name,
            description: apiItem.description,
            price: apiItem.price,
            image: apiItem.image,
            isAvailable: apiItem.isAvailable,
            category: apiItem.category,
            addOns: apiItem.addOns || [],
            createdAt: apiItem.createdAt,
            updatedAt: apiItem.updatedAt,
            preparationTime: apiItem.preparationTime
        }
    }
}

export default MenuService