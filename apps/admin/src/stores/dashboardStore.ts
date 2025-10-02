import { create } from 'zustand'
import { dashboardService } from '../services/dashboardService'
import { ActivityFeedItem, AdminDashboardStats, CustomerAnalytics, DashboardFilters, OrderAnalytics, RiderAnalytics, VendorAnalytics } from '../types/dashboard'

interface DashboardStore {
    isDashboardLoading: boolean
    dashboardStats: AdminDashboardStats | null
    activityFeed: ActivityFeedItem[]
    orderAnalytics: OrderAnalytics | null
    riderAnalytics: RiderAnalytics | null
    vendorAnalytics: VendorAnalytics | null
    customerAnalytics: CustomerAnalytics | null
    
    // Actions
    setIsDashboardLoading: (loading: boolean) => void
    setDashboardStats: (stats: AdminDashboardStats | null) => void
    setActivityFeed: (feed: ActivityFeedItem[]) => void
    setOrderAnalytics: (analytics: OrderAnalytics | null) => void
    setRiderAnalytics: (analytics: RiderAnalytics | null) => void
    setVendorAnalytics: (analytics: VendorAnalytics | null) => void
    setCustomerAnalytics: (analytics: CustomerAnalytics | null) => void
    
    refreshDashboard: () => Promise<void>
    refreshAnalytics: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
    isDashboardLoading: true,
    dashboardStats: null,
    activityFeed: [],
    orderAnalytics: null,
    riderAnalytics: null,
    vendorAnalytics: null,
    customerAnalytics: null,

    setIsDashboardLoading: (isDashboardLoading) => set({ isDashboardLoading }),
    setDashboardStats: (dashboardStats) => set({ dashboardStats }),
    setActivityFeed: (activityFeed) => set({ activityFeed }),
    setOrderAnalytics: (orderAnalytics) => set({ orderAnalytics }),
    setRiderAnalytics: (riderAnalytics) => set({ riderAnalytics }),
    setVendorAnalytics: (vendorAnalytics) => set({ vendorAnalytics }),
    setCustomerAnalytics: (customerAnalytics) => set({ customerAnalytics }),

    // Get dashboard stats
    async getDashboardStats(filters?: DashboardFilters): Promise<AdminDashboardStats> {
        try {
            set({ isDashboardLoading: true })
            const params = new URLSearchParams()
            if (filters?.dateRange) {
                params.append('dateRange', JSON.stringify(filters.dateRange))
            }
            if (filters?.timezone) {
                params.append('timezone', filters.timezone)
            }

            const response = await dashboardService.getDashboardStats(filters)
            set({ dashboardStats: response as AdminDashboardStats })
            return response as AdminDashboardStats
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get dashboard stats')
        } finally {
            set({ isDashboardLoading: false })
        }
    },

    // Get activity feed
    async getActivityFeed(limit = 20, offset = 0): Promise<ActivityFeedItem[]> {
        try {
            set({ isDashboardLoading: true })
            const response = await dashboardService.getActivityFeed(limit, offset)
            set({ activityFeed: response as ActivityFeedItem[] })
            return response as ActivityFeedItem[]
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get activity feed')
        } finally {
            set({ isDashboardLoading: false })
        }
    },

    // Get order analytics
    async getOrderAnalytics(filters?: DashboardFilters): Promise<OrderAnalytics> {
        try {
            set({ isDashboardLoading: true })
            const params = new URLSearchParams()
            if (filters?.dateRange) {
                params.append('dateRange', JSON.stringify(filters.dateRange))
            }
            if (filters?.timezone) {
                params.append('timezone', filters.timezone)
            }

            const response = await dashboardService.getOrderAnalytics(filters)
            set({ orderAnalytics: response as OrderAnalytics })
            return response as OrderAnalytics
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get order analytics')
        } finally {
            set({ isDashboardLoading: false })
        }
    },

    // Get rider analytics
    async getRiderAnalytics(): Promise<RiderAnalytics> {
        try {
            set({ isDashboardLoading: true })
            const response = await dashboardService.getRiderAnalytics()
            set({ riderAnalytics: response as RiderAnalytics })
            return response as RiderAnalytics
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get rider analytics')
        } finally {
            set({ isDashboardLoading: false })
        }
    },

    // Get vendor analytics
    async getVendorAnalytics(): Promise<VendorAnalytics> {
        try {
            set({ isDashboardLoading: true })
            const response = await dashboardService.getVendorAnalytics()
            set({ vendorAnalytics: response as VendorAnalytics })
            return response as VendorAnalytics
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get vendor analytics')
        } finally {
            set({ isDashboardLoading: false })
        }
    },

    // Get customer analytics
    async getCustomerAnalytics(): Promise<CustomerAnalytics> {
        try {
            set({ isDashboardLoading: true })
            const response = await dashboardService.getCustomerAnalytics()
            set({ customerAnalytics: response as CustomerAnalytics })
            return response as CustomerAnalytics
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get customer analytics')
        } finally {
            set({ isDashboardLoading: false })
        }
    },    

    refreshDashboard: async () => {
        try {
            const [stats, activityFeed] = await Promise.all([
                dashboardService.getDashboardStats(),
                dashboardService.getActivityFeed(10)
            ])
            
            set({ 
                dashboardStats: stats,
                activityFeed: activityFeed
            })
        } catch (error) {
            console.error('Failed to refresh dashboard:', error)
        }
    },

    refreshAnalytics: async () => {
        try {
            const [orderAnalytics, riderAnalytics, vendorAnalytics, customerAnalytics] = await Promise.all([
                dashboardService.getOrderAnalytics(),
                dashboardService.getRiderAnalytics(),
                dashboardService.getVendorAnalytics(),
                dashboardService.getCustomerAnalytics()
            ])
            
            set({ 
                orderAnalytics,
                riderAnalytics,
                vendorAnalytics,
                customerAnalytics
            })
        } catch (error) {
            console.error('Failed to refresh analytics:', error)
        }
    }
}))