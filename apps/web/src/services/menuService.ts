import api from './api'
import { MenuItem, MenuCategory, CreateMenuItemData, MenuFilters, UpdateMenuItemData, CreateCategoryData } from '../types/menu'

function logError(error: any, context: string) {
    console.error(`[MenuService] ${context}:`, error?.response?.data || error?.message || error)
}

export class MenuService {
    // Menu Items
    static async createMenuItem(data: CreateMenuItemData, imageFile?: File): Promise<MenuItem> {
        try {
            const formData = new FormData()
            
            // Add text fields
            formData.append('name', data.name)
            formData.append('description', data.description || '')
            formData.append('price', data.price.toString())
            formData.append('categoryId', data.categoryId)
            formData.append('preparationTime', (data.preparationTime || 15).toString())
            
            // Add add-ons as JSON string
            if (data.addOns && data.addOns.length > 0) {
                formData.append('addOns', JSON.stringify(data.addOns))
            }
            
            // Add image file if provided
            if (imageFile) {
                formData.append('image', imageFile)
            } else if (data.image) {
                // If image is a URL (from editing), add it as a field
                formData.append('image', data.image)
            }

            const response = await api.post('/menu/menu-items', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
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

            const response = await api.get(`/menu/menu-items?${params.toString()}`)
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
            const response = await api.get(`/menu/menu-items/${menuItemId}`)
            return response.data.data
        } catch (error) {
            logError(error, 'getMenuItem')
            throw error
        }
    }

    static async updateMenuItem(menuItemId: string, data: UpdateMenuItemData, imageFile?: File): Promise<MenuItem> {
        try {
            const formData = new FormData()
            
            // Add text fields
            if (data.name) formData.append('name', data.name)
            if (data.description !== undefined) formData.append('description', data.description)
            if (data.price !== undefined) formData.append('price', data.price.toString())
            if (data.categoryId) formData.append('categoryId', data.categoryId)
            if (data.preparationTime !== undefined) formData.append('preparationTime', data.preparationTime.toString())
            
            // Add add-ons as JSON string
            if (data.addOns) {
                formData.append('addOns', JSON.stringify(data.addOns))
            }
            
            // Add image file if provided
            if (imageFile) {
                formData.append('image', imageFile)
            } else if (data.image) {
                // If image is a URL (from editing), add it as a field
                formData.append('image', data.image)
            }

            const response = await api.put(`/menu/menu-items/${menuItemId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data.data
        } catch (error) {
            logError(error, 'updateMenuItem')
            throw error
        }
    }

    static async deleteMenuItem(menuItemId: string): Promise<void> {
        try {
            await api.delete(`/menu/menu-items/${menuItemId}`)
        } catch (error) {
            logError(error, 'deleteMenuItem')
            throw error
        }
    }

    static async toggleMenuItemAvailability(menuItemId: string): Promise<MenuItem> {
        try {
            const response = await api.patch(`/menu/menu-items/${menuItemId}/toggle`)
            return response.data.data
        } catch (error) {
            logError(error, 'toggleMenuItemAvailability')
            throw error
        }
    }

    // Categories
    static async createCategory(data: CreateCategoryData, imageFile?: File): Promise<MenuCategory> {
        try {
            const formData = new FormData()
            
            // Add text fields
            formData.append('name', data.name)
            if (data.description) formData.append('description', data.description)
            
            // Add image file if provided
            if (imageFile) {
                formData.append('image', imageFile)
            } else if (data.image) {
                // If image is a URL (from editing), add it as a field
                formData.append('image', data.image)
            }

            const response = await api.post('/menu/categories', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data.data
        } catch (error) {
            logError(error, 'createCategory')
            throw error
        }
    }

    static async getCategories(): Promise<MenuCategory[]> {
        try {
            const response = await api.get('/menu/categories')
            return response.data.data
        } catch (error) {
            logError(error, 'getCategories')
            throw error
        }
    }

    static async updateCategory(categoryId: string, data: Partial<CreateCategoryData>, imageFile?: File): Promise<MenuCategory> {
        try {
            const formData = new FormData()
            
            // Add text fields
            if (data.name) formData.append('name', data.name)
            if (data.description !== undefined) formData.append('description', data.description)
            
            // Add image file if provided
            if (imageFile) {
                formData.append('image', imageFile)
            } else if (data.image) {
                // If image is a URL (from editing), add it as a field
                formData.append('image', data.image)
            }

            const response = await api.put(`/menu/categories/${categoryId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
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