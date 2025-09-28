import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MenuService } from '../services/menuService'
import { CreateMenuItemData, UpdateMenuItemData, CreateCategoryData, MenuFilters } from '../types/menu'

export function useCreateMenuItem() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ data, imageFile }: { data: CreateMenuItemData; imageFile?: File }) => 
            MenuService.createMenuItem(data, imageFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-items'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

export function useUpdateMenuItem() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ id, data, imageFile }: { id: string; data: UpdateMenuItemData; imageFile?: File }) => 
            MenuService.updateMenuItem(id, data, imageFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-items'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

export function useCreateCategory() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ data, imageFile }: { data: CreateCategoryData; imageFile?: File }) => 
            MenuService.createCategory(data, imageFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

export function useUpdateCategory() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ id, data, imageFile }: { id: string; data: Partial<CreateCategoryData>; imageFile?: File }) => 
            MenuService.updateCategory(id, data, imageFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

export function useMenuItems(filters?: MenuFilters) {
    return useQuery({
        queryKey: ['menu-items', filters],
        queryFn: () => MenuService.getMenuItems(filters)
    })
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => MenuService.getCategories()
    })
}

export function useMenuItem(menuItemId: string) {
    return useQuery({
        queryKey: ['menu-item', menuItemId],
        queryFn: () => MenuService.getMenuItem(menuItemId),
        enabled: !!menuItemId
    })
}

export function useDeleteMenuItem() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (menuItemId: string) => MenuService.deleteMenuItem(menuItemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-items'] })
        }
    })
}

export function useDeleteCategory() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (categoryId: string) => MenuService.deleteCategory(categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
    })
}

export function useToggleMenuItemAvailability() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (menuItemId: string) => MenuService.toggleMenuItemAvailability(menuItemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-items'] })
        }
    })
}