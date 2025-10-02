import { dashboardService } from '../services/dashboardService'
import { DashboardFilters } from '../types/dashboard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query keys
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: (filters?: DashboardFilters) => [...dashboardKeys.all, 'stats', filters] as const,
    activityFeed: (limit?: number, offset?: number) => [...dashboardKeys.all, 'activity-feed', limit, offset] as const,
    orderAnalytics: (filters?: DashboardFilters) => [...dashboardKeys.all, 'order-analytics', filters] as const,
    riderAnalytics: () => [...dashboardKeys.all, 'rider-analytics'] as const,
    vendorAnalytics: () => [...dashboardKeys.all, 'vendor-analytics'] as const,
    customerAnalytics: () => [...dashboardKeys.all, 'customer-analytics'] as const,
}

// Dashboard stats hook - NO periodic refetching
export function useDashboardStats(filters?: DashboardFilters) {
    return useQuery({
        queryKey: dashboardKeys.stats(filters),
        queryFn: () => dashboardService.getDashboardStats(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
    })
}

// Activity feed hook - NO periodic refetching
export function useActivityFeed(limit = 20, offset = 0) {
    return useQuery({
        queryKey: dashboardKeys.activityFeed(limit, offset),
        queryFn: () => dashboardService.getActivityFeed(limit, offset),
        staleTime: 2 * 60 * 1000, // 2 minutes - activity feed can be a bit stale
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}

// Order analytics hook - NO periodic refetching
export function useOrderAnalytics(filters?: DashboardFilters) {
    return useQuery({
        queryKey: dashboardKeys.orderAnalytics(filters),
        queryFn: () => dashboardService.getOrderAnalytics(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes - analytics can be stale longer
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}

// Rider analytics hook - NO periodic refetching
export function useRiderAnalytics() {
    return useQuery({
        queryKey: dashboardKeys.riderAnalytics(),
        queryFn: () => dashboardService.getRiderAnalytics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}

// Vendor analytics hook - NO periodic refetching
export function useVendorAnalytics() {
    return useQuery({
        queryKey: dashboardKeys.vendorAnalytics(),
        queryFn: () => dashboardService.getVendorAnalytics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}

// Customer analytics hook - NO periodic refetching
export function useCustomerAnalytics() {
    return useQuery({
        queryKey: dashboardKeys.customerAnalytics(),
        queryFn: () => dashboardService.getCustomerAnalytics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}

// Refresh dashboard mutation - Manual refresh only
export function useRefreshDashboard() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async () => {
            // Invalidate all dashboard queries to trigger fresh fetch
            await queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        },
        onSuccess: () => {
            // Optional: Show success toast or update UI
            console.log('Dashboard refreshed successfully')
        },
        onError: (error) => {
            // Optional: Show error toast
            console.error('Failed to refresh dashboard:', error)
        }
    })
}

// Combined dashboard data hook for convenience
export function useDashboardData(filters?: DashboardFilters) {
    const dashboardStats = useDashboardStats(filters)
    const activityFeed = useActivityFeed()
    const orderAnalytics = useOrderAnalytics(filters)
    const riderAnalytics = useRiderAnalytics()
    const vendorAnalytics = useVendorAnalytics()
    const customerAnalytics = useCustomerAnalytics()
    const refreshDashboard = useRefreshDashboard()

    const isLoading = dashboardStats.isLoading || 
                     activityFeed.isLoading || 
                     orderAnalytics.isLoading || 
                     riderAnalytics.isLoading || 
                     vendorAnalytics.isLoading || 
                     customerAnalytics.isLoading

    const isError = dashboardStats.isError || 
                   activityFeed.isError || 
                   orderAnalytics.isError || 
                   riderAnalytics.isError || 
                   vendorAnalytics.isError || 
                   customerAnalytics.isError

    return {
        // Data
        dashboardStats: dashboardStats.data,
        activityFeed: activityFeed.data || [],
        orderAnalytics: orderAnalytics.data,
        riderAnalytics: riderAnalytics.data,
        vendorAnalytics: vendorAnalytics.data,
        customerAnalytics: customerAnalytics.data,
        
        // Loading states
        isLoading,
        isStatsLoading: dashboardStats.isLoading,
        isActivityLoading: activityFeed.isLoading,
        isAnalyticsLoading: orderAnalytics.isLoading || riderAnalytics.isLoading || vendorAnalytics.isLoading || customerAnalytics.isLoading,
        
        // Error states
        isError,
        error: dashboardStats.error || activityFeed.error || orderAnalytics.error || riderAnalytics.error || vendorAnalytics.error || customerAnalytics.error,
        
        // Actions - Manual refresh only
        refreshDashboard: refreshDashboard.mutate,
        isRefreshing: refreshDashboard.isPending,
        
        // Individual refetch functions
        refetchStats: dashboardStats.refetch,
        refetchActivity: activityFeed.refetch,
        refetchAnalytics: () => {
            orderAnalytics.refetch()
            riderAnalytics.refetch()
            vendorAnalytics.refetch()
            customerAnalytics.refetch()
        },
    }
}
