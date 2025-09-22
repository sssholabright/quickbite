import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MenuService from '../services/menuService'
import { CreateMenuItemData, UpdateMenuItemData, MenuFilters, CreateCategoryData } from '../types/menu'
import { showSuccess, showError } from '../utils/sweetAlert'

// Query Keys
export const menuKeys = {
    all: ['menu'] as const,
    items: () => [...menuKeys.all, 'items'] as const,
    itemsList: (filters?: MenuFilters) => [...menuKeys.items(), 'list', filters] as const,
    item: (id: string) => [...menuKeys.items(), 'detail', id] as const,
    categories: () => [...menuKeys.all, 'categories'] as const,
}

// Menu Items Hooks
export const useMenuItems = (filters?: MenuFilters) => {
    return useQuery({
        queryKey: menuKeys.itemsList(filters),
        queryFn: () => MenuService.getMenuItems(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

export const useMenuItem = (id: string) => {
    return useQuery({
        queryKey: menuKeys.item(id),
        queryFn: () => MenuService.getMenuItem(id),
        enabled: !!id,
    })
}

export const useCreateMenuItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateMenuItemData) => MenuService.createMenuItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.items() })
            showSuccess('Menu item created successfully!')
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to create menu item')
        },
    })
}

export const useUpdateMenuItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemData }) => 
            MenuService.updateMenuItem(id, data),
            onSuccess: (updatedItem) => {
                queryClient.setQueryData(menuKeys.item(updatedItem.id), updatedItem)
                queryClient.invalidateQueries({ queryKey: menuKeys.items() })
                showSuccess('Menu item updated successfully!')
            },
            onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to update menu item')
        },
    })
}

export const useDeleteMenuItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => MenuService.deleteMenuItem(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: menuKeys.item(deletedId) })
            queryClient.invalidateQueries({ queryKey: menuKeys.items() })
            showSuccess('Menu item deleted successfully!')
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to delete menu item')
        },
    })
}

export const useToggleMenuItemAvailability = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => MenuService.toggleMenuItemAvailability(id),
        onSuccess: (updatedItem) => {
            queryClient.setQueryData(menuKeys.item(updatedItem.id), updatedItem)
            queryClient.invalidateQueries({ queryKey: menuKeys.items() })
            showSuccess('Menu item availability updated!')
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to update availability')
        },
    })
}

// Categories Hooks
export const useCategories = () => {
    return useQuery({
        queryKey: menuKeys.categories(),
        queryFn: () => MenuService.getCategories(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

export const useCreateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateCategoryData) => MenuService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
            showSuccess('Category created successfully!')
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to create category')
        },
    })
}

export const useUpdateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => 
            MenuService.updateCategory(id, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
                showSuccess('Category updated successfully!')
            },
            onError: (error: any) => {
                showError(error?.response?.data?.message || 'Failed to update category')
            },
    })
}

export const useDeleteCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => MenuService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
            showSuccess('Category deleted successfully!')
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || 'Failed to delete category')
        },
    })
}