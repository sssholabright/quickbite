// ... existing interfaces ...

// Riders interfaces
export interface RidersListParams {
    page?: number;
    limit?: number;
    filters?: {
        search?: string;
        companyId?: string;
        status?: string;
        isOnline?: boolean;
    };
    sort?: {
        field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status';
        direction: 'asc' | 'desc';
    };
}

export interface RidersListResponse {
    data: RiderListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateRiderRequest {
    name: string;
    phone: string;
    email: string;
    password: string;
    companyId: string;
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    bankAccount?: string;
}

export interface UpdateRiderRequest {
    name?: string;
    phone?: string;
    email?: string;
    vehicleType?: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    bankAccount?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    companyId?: string;
}

// Update existing RiderListItem to match frontend
export interface RiderListItem {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    earningsTotal?: number | undefined;
    completedOrders?: number | undefined;
    cancelledOrders?: number | undefined;
    company?: { id: string; name: string; } | undefined;
    createdAt: string;
    updatedAt: string;
}

// Update existing RiderDetails to match frontend
export interface RiderDetails {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    earningsTotal?: number | undefined;
    completedOrders?: number | undefined;
    cancelledOrders?: number | undefined;
    currentOrderId?: string | undefined;
    bankAccount?: string | undefined;
    company?: {
        id: string;
        name: string;
    } | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface ActionResponse {
    success: boolean;
    message: string;
    data?: any;
}