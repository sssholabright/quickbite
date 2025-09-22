import { create } from 'zustand'
import { Order, OrderStats, OrderFilters, OrderStatus } from '../types/order'
import { mockOrders, mockOrderStats } from '../lib/mockOrders'

interface OrderStore {
    orders: Order[]
    stats: OrderStats | null
    isLoading: boolean
    error: string | null
    filters: OrderFilters
    setOrders: (orders: Order[]) => void
    setStats: (stats: OrderStats) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setFilters: (filters: OrderFilters) => void
    fetchOrders: (filters?: OrderFilters) => Promise<void>
    fetchStats: () => Promise<void>
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
    acceptOrder: (orderId: string) => Promise<void>
    rejectOrder: (orderId: string, reason?: string) => Promise<void>
    refreshOrders: () => Promise<void>
}

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: [],
    stats: null,
    isLoading: false,
    error: null,
    filters: {},

    setOrders: (orders) => set({ orders }),
    setStats: (stats) => set({ stats }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setFilters: (filters) => set({ filters }),

    fetchOrders: async (filters) => {
        set({ isLoading: true, error: null })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
            let filteredOrders = [...mockOrders]
            
            // Apply filters
            if (filters?.status) {
                filteredOrders = filteredOrders.filter(order => order.status === filters.status)
            }
            
            if (filters?.search) {
                const searchTerm = filters.search.toLowerCase()
                filteredOrders = filteredOrders.filter(order => 
                    order.orderNumber.toLowerCase().includes(searchTerm) ||
                    order.customerName.toLowerCase().includes(searchTerm)
                )
            }
            
            if (filters?.dateFrom) {
                const fromDate = new Date(filters.dateFrom)
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= fromDate
                )
            }
            
            if (filters?.dateTo) {
                const toDate = new Date(filters.dateTo)
                toDate.setHours(23, 59, 59, 999) // End of day
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) <= toDate
                )
            }
            
            set({ orders: filteredOrders, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    fetchStats: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        set({ stats: mockOrderStats })
    },

    updateOrderStatus: async (orderId, status) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const orders = get().orders.map(order => 
                order.id === orderId 
                    ? { ...order, status, updatedAt: new Date().toISOString() }
                    : order
            )
            set({ orders, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    acceptOrder: async (orderId) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const orders = get().orders.map(order => 
                order.id === orderId 
                    ? { ...order, status: 'CONFIRMED' as OrderStatus, updatedAt: new Date().toISOString() }
                    : order
            )
            set({ orders, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    rejectOrder: async (orderId, reason) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const orders = get().orders.map(order => 
                order.id === orderId 
                    ? { ...order, status: 'CANCELLED' as OrderStatus, updatedAt: new Date().toISOString() }
                    : order
            )
            set({ orders, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    refreshOrders: async () => {
        await get().fetchOrders()
    }
}))