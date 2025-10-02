// Dashboard interfaces
export interface AdminDashboardStats {
    ordersToday: number;
    totalRevenue: number;
    onlineRiders: number;
    activeVendors: number;
    pendingOrders: number;
    completedOrders: number;
    readyForPickupOrders: number;
    deliveredOrdersToday: number;
    readyForPickupToday: number;
    cancelledOrders: number;
    cancelledOrdersToday: number;
    pendingOrdersToday: number;
    totalCustomers: number;
    averageOrderValue: number;
    completionRate: number;
}

export interface ActivityFeedItem {
    id: string;
    type: 'order' | 'rider' | 'vendor' | 'customer' | 'payment' | 'system';
    message: string;
    timestamp: string;
    metadata?: {
        orderId?: string;
        riderId?: string;
        vendorId?: string;
        customerId?: string;
        amount?: number;
        status?: string;
    };
}

export interface DashboardFilters {
    dateRange?: {
        start: string;
        end: string;
    };
    timezone?: string;
}

export interface OrderAnalytics {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    completionRate: number;
    ordersByStatus: {
        status: string;
        count: number;
        percentage: number;
    }[];
}

export interface RiderAnalytics {
    totalRiders: number;
    onlineRiders: number;
    availableRiders: number;
    busyRiders: number;
    averageRating: number;
    totalDeliveries: number;
    averageDeliveryTime: number;
}

export interface VendorAnalytics {
    totalVendors: number;
    activeVendors: number;
    inactiveVendors: number;
    averageRating: number;
    totalOrders: number;
    averagePrepTime: number;
}

export interface CustomerAnalytics {
    totalCustomers: number;
    activeCustomers: number;
    newCustomersToday: number;
    averageOrderValue: number;
    totalOrders: number;
}