export interface CustomerFilters {
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING';
    dateRange?: {
        start: string;
        end: string;
    };
}

export interface CustomerSort {
    field: 'name' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'avgOrderValue';
    direction: 'asc' | 'desc';
}

export interface CustomerListItem {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING';
    avatar: string | null;
    dateOfBirth: string | null;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    completionRate: number;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerDetails extends CustomerListItem {
    user: {
        id: string;
        isActive: boolean;
    };
    performance: {
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        totalSpent: number;
        avgOrderValue: number;
        completionRate: number;
        lastOrderDate: string | null;
    };
    addresses: {
        id: string;
        title: string;
        address: string;
        city: string | null;
        state: string | null;
        country: string;
        isDefault: boolean;
        lat: number | null;
        lng: number | null;
    }[];
    recentOrders: {
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        vendorName: string;
        createdAt: string;
    }[];
}

export interface UpdateCustomerRequest {
    name?: string;
    email?: string;
    phone?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING';
}

export interface CustomersListResponse {
    data: CustomerListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ActionResponse {
    success: boolean;
    message: string;
}