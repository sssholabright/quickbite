export interface VendorProfileData {
    businessName?: string;
    businessAddress?: string;
    description?: string;
    logo?: string;
    latitude?: number;
    longitude?: number;
    isOpen?: boolean;
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
}

export interface VendorProfileResponse {
    id: string;
    userId: string;
    businessName: string;
    businessAddress?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    logo?: string;
    coverImage?: string;
    isActive: boolean;
    isOpen: boolean;
    rating: number;
    status: string;
    openingTime?: string;
    closingTime?: string;
    operatingDays: string[];
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    avgPrepTime?: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
}

export interface VendorSettings {
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        orderUpdates: boolean;
        paymentUpdates: boolean;
        marketing: boolean;
    };
    business: {
        isOpen: boolean;
        operatingHours: {
            [key: string]: {
                open: string;
                close: string;
                isOpen: boolean;
            };
        };
        deliveryRadius: number;
        minimumOrderAmount: number;
    };
}
