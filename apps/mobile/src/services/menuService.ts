import { ApiResponse } from '../types/auth'
import apiClient from './api'

export interface PublicVendor {
    id: string
    businessName: string
    description?: string | null
    logo?: string | null
    coverImage?: string | null
    rating: number
    isOpen: boolean
    isActive: boolean
}

export interface PublicCategory {
    id: string
    name: string
    image?: string | null
}

export interface PublicMenuAddOn {
    id: string
    name: string
    description?: string | null
    price: number
    isRequired: boolean
    maxQuantity: number
    category: string
}

export interface PublicMenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    image?: string | null
    preparationTime: number
    isAvailable: boolean
    category: { id: string; name: string }
    addOns: PublicMenuAddOn[]
}

export const menuService = {
    getVendors: async (params?: { search?: string; hasAvailableItems?: boolean }) => {
        try {
            const res = await apiClient.get<ApiResponse<PublicVendor[]>>('/menu/vendors', { params });
            return res.data.data;
        } catch (error) {
            console.error('Error fetching vendors:', error);
            throw error;
        }
    },
    getVendorCategories: async (vendorId: string) => {
        try {
            const res = await apiClient.get<ApiResponse<PublicCategory[]>>(`/menu/vendors/${vendorId}/categories`);
            return res.data.data;
        } catch (error) {
            console.error('Error fetching vendor categories:', error);
            throw error;
        }
    },
    getVendorItems: async (vendorId: string, params?: { categoryId?: string; search?: string }) => {
        try {
            const res = await apiClient.get<ApiResponse<PublicMenuItem[]>>(`/menu/vendors/${vendorId}/menu-items`, { params });
            return res.data.data;
        } catch (error) {
            console.error('Error fetching vendor items:', error);
            throw error;
        }
    }
}