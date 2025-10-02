import { ActivityFeedItem, AdminDashboardStats, CustomerAnalytics, DashboardFilters, OrderAnalytics, RiderAnalytics, VendorAnalytics } from "../types/dashboard"
import api from "./api"
import { ApiResponse } from "../types/auth"

class DashboardService {
    // Get dashboard stats
    async getDashboardStats(filters?: DashboardFilters): Promise<AdminDashboardStats> {
        try {
            const params = new URLSearchParams()
            if (filters?.dateRange) {
                params.append('dateRange', JSON.stringify(filters.dateRange))
            }
            if (filters?.timezone) {
                params.append('timezone', filters.timezone)
            }

            const response = await api.get<ApiResponse<AdminDashboardStats>>(
                `/stats/dashboard/stats?${params.toString()}`
            )
            return response.data.data as AdminDashboardStats
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get dashboard stats')
        }
    }

    // Get activity feed
    async getActivityFeed(limit = 20, offset = 0): Promise<ActivityFeedItem[]> {
        try {
            const response = await api.get<ApiResponse<ActivityFeedItem[]>>(
                `/stats/activity-feed?limit=${limit}&offset=${offset}`
            )
            return response.data.data as ActivityFeedItem[]
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get activity feed')
        }
    }

    // Get order analytics
    async getOrderAnalytics(filters?: DashboardFilters): Promise<OrderAnalytics> {
        try {
            const params = new URLSearchParams()
            if (filters?.dateRange) {
                params.append('dateRange', JSON.stringify(filters.dateRange))
            }
            if (filters?.timezone) {
                params.append('timezone', filters.timezone)
            }

            const response = await api.get<ApiResponse<OrderAnalytics>>(
                `/stats/analytics/orders?${params.toString()}`
            )
            return response.data.data as OrderAnalytics
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get order analytics')
        }
    }

    // Get rider analytics
    async getRiderAnalytics(): Promise<RiderAnalytics> {
        try {
            const response = await api.get<ApiResponse<RiderAnalytics>>('/stats/analytics/riders')
            return response.data.data as RiderAnalytics
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get rider analytics')
        }
    }

    // Get vendor analytics
    async getVendorAnalytics(): Promise<VendorAnalytics> {
        try {
            const response = await api.get<ApiResponse<VendorAnalytics>>('/stats/analytics/vendors')
            return response.data.data as VendorAnalytics
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get vendor analytics')
        }
    }

    // Get customer analytics
    async getCustomerAnalytics(): Promise<CustomerAnalytics> {
        try {
            const response = await api.get<ApiResponse<CustomerAnalytics>>('/stats/analytics/customers')
            return response.data.data as CustomerAnalytics
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get customer analytics')
        }
    }
}

export const dashboardService = new DashboardService()