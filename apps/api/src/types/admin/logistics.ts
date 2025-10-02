export interface LogisticsCompany {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    createdAt: string;
    updatedAt: string;
}

export interface LogisticsCompanyListItem {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    ridersCount: number;
    onlineRidersCount: number;
    totalEarnings: number;
    createdAt: string;
}

export interface RiderListItem {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email: string;
    company?: {
        id: string;
        name: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    };
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    isAvailable: boolean;
    currentOrderId?: string;
    earnings: number;
    completedOrders: number;
    rating: number;
    createdAt: string;
}

export interface RiderDetails {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email: string;
    company?: {
        id: string;
        name: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    };
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    isAvailable: boolean;
    currentOrderId?: string;
    earnings: number;
    completedOrders: number;
    rating: number;
    bankAccount?: string;
    currentLat?: number;
    currentLng?: number;
    earningsHistory: RiderEarning[];
    orderHistory: RiderOrderHistoryItem[];
    createdAt: string;
    updatedAt: string;
}

export interface RiderEarning {
    id: string;
    amount: number;
    type: 'DELIVERY_FEE' | 'BONUS' | 'TIP' | 'PENALTY';
    description?: string;
    orderId?: string;
    date: string;
}

export interface RiderOrderHistoryItem {
    id: string;
    orderId: string;
    status: 'COMPLETED' | 'CANCELLED' | 'REASSIGNED' | 'FAILED';
    timestamp: string;
    notes?: string;
}

export interface LogisticsCompaniesListParams {
    page?: number;
    limit?: number;
    filters?: {
        status?: string;
        search?: string;
    };
    sort?: {
        field: 'name' | 'status' | 'createdAt';
        direction: 'asc' | 'desc';
    };
}

export interface RidersListParams {
    page?: number;
    limit?: number;
    filters?: {
        companyId?: string;
        status?: string;
        isOnline?: boolean;
        search?: string;
    };
    sort?: {
        field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt';
        direction: 'asc' | 'desc';
    };
}

export interface CreateLogisticsCompanyRequest {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address?: string;
}

export interface UpdateLogisticsCompanyRequest {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
}

export interface CreateRiderRequest {
    name: string;
    phone: string;
    email?: string;
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
}

export interface LogisticsCompaniesListResponse {
    data: LogisticsCompanyListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
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

export interface ActionResponse {
    success: boolean;
    message: string;
}
