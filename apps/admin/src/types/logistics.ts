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
    updatedAt: string;
}

export interface RiderListItem {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    earningsTotal?: number;
    completedOrders?: number;
    cancelledOrders?: number;
    company?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
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
        field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status';
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
    data?: any;
}

export interface RiderDetails {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE';
    isOnline: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
    earningsTotal?: number;
    completedOrders?: number;
    cancelledOrders?: number;
    currentOrderId?: string;
    bankAccount?: string;
    company?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
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
}

export interface RiderSort {
    field: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status';
    direction: 'asc' | 'desc';
}