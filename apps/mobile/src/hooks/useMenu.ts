import { useQuery } from '@tanstack/react-query'
import { menuService } from '../services/menuService'

// Query Keys
export const menuKeys = {
    vendors: (params?: { search?: string; hasAvailableItems?: boolean }) => ['vendors', params] as const,
    vendorCategories: (vendorId: string) => ['vendorCategories', vendorId] as const,
    vendorItems: (vendorId: string, params?: { categoryId?: string; search?: string }) => ['vendorItems', vendorId, params] as const,
    allCategories: () => ['allCategories'] as const,
}

// Vendors Hook
export const useVendors = (filters?: { hasAvailableItems?: boolean }) => {
    return useQuery({
        queryKey: ['vendors', filters],
        queryFn: async () => {
            const response = await menuService.getVendors(filters);
            return response;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

// Vendor Categories Hook
export const useVendorCategories = (vendorId: string) =>
    useQuery({
        queryKey: menuKeys.vendorCategories(vendorId),
        queryFn: () => menuService.getVendorCategories(vendorId),
        enabled: !!vendorId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })

// Vendor Menu Items Hook
export const useVendorMenuItems = (vendorId: string, params?: { categoryId?: string; search?: string }) =>
    useQuery({
        queryKey: menuKeys.vendorItems(vendorId, params),
        queryFn: () => menuService.getVendorItems(vendorId, params),
        enabled: !!vendorId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })

// All Categories Hook
export const useAllCategories = () =>
    useQuery({
        queryKey: menuKeys.allCategories(),
        queryFn: () => menuService.getAllCategories(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    })