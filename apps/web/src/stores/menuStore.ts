import { create } from 'zustand'
import { MenuItem, MenuCategory, MenuFilters } from '../types/menu'
import MenuService from '../services/menuService'

interface MenuStore {
    items: MenuItem[]
    categories: MenuCategory[]
    isLoading: boolean
    error: string | null
    filters: MenuFilters
    setItems: (items: MenuItem[]) => void
    setCategories: (categories: MenuCategory[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setFilters: (filters: MenuFilters) => void
    fetchItems: (filters?: MenuFilters) => Promise<void>
    fetchCategories: () => Promise<void>
    addItem: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    updateItem: (id: string, updates: Partial<MenuItem>) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    toggleAvailability: (id: string) => Promise<void>
}

export const useMenuStore = create<MenuStore>((set, get) => ({
    items: [],
    categories: [],
    isLoading: false,
    error: null,
    filters: {},

    setItems: (items) => set({ items }),
    setCategories: (categories) => set({ categories }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setFilters: (filters) => set({ filters }),

    fetchItems: async (filters) => {
        set({ isLoading: true, error: null })
        
        try {
            const items = await MenuService.getMenuItems(filters)
            set({ items, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    fetchCategories: async () => {
        try {
            const categories = await MenuService.getCategories()
            set({ categories })
        } catch (error: any) {
            set({ error: error.message })
        }
    },

    addItem: async (itemData) => {
        set({ isLoading: true, error: null })
        
        try {
            const newItem = await MenuService.createMenuItem(itemData)
            const items = get().items
            set({ items: [newItem, ...items], isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateItem: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
            const updatedItem = await MenuService.updateMenuItem(id, updates)
            const items = get().items.map(item => 
                item.id === id ? updatedItem : item
            )
            set({ items, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    deleteItem: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
            await MenuService.deleteMenuItem(id)
            const items = get().items.filter(item => item.id !== id)
            set({ items, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    toggleAvailability: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
            const updatedItem = await MenuService.toggleMenuItemAvailability(id)
            const items = get().items.map(item => 
                item.id === id ? updatedItem : item
            )
            set({ items, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    }
}))