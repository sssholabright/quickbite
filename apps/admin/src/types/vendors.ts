export interface VendorFilters {
    search?: string;
    status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED';
    isOpen?: boolean;
}

export interface VendorSort {
    field: 'businessName' | 'createdAt' | 'totalOrders' | 'avgPrepTime' | 'rating';
    direction: 'asc' | 'desc';
}

export interface VendorListItem {
    id: string;
    businessName: string;
    email: string;
    phone: string;
    status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED';
    isOpen: boolean;
    rating: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    avgPrepTime: number | null;
    activeMenuCount: number;
    logo: string | null;
    location: {
        latitude: number | null;
        longitude: number | null;
        address: string | null;
    };
    operationalHours: {
        openingTime: string | null;
        closingTime: string | null;
        operatingDays: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface VendorDetails extends VendorListItem {
    description: string | null;
    coverImage: string | null;
    user: {
        id: string;
        name: string;
        avatar: string | null;
        isActive: boolean;
    };
    performance: {
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        avgPrepTime: number | null;
        completionRate: number;
    };
}

export interface CreateVendorRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
    businessAddress?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
}

export interface UpdateVendorRequest {
    name?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    businessAddress?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
    status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED';
}

export interface UpdateVendorLocationRequest {
    latitude: number;
    longitude: number;
    businessAddress?: string;
}

export interface VendorsListResponse {
    data: VendorListItem[];
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