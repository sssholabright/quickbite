// Job types
export interface DeliveryJobData {
    orderId: string;
    vendorId: string;
    customerId: string;
    vendorName: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string;
    deliveryFee: number;
    distance: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: Date;
    expiresAt: Date;
}

export interface LocationUpdateJobData {
    riderId: string;
    orderId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
}

export interface ETAUpdateJobData {
    orderId: string;
    customerId: string;
    riderId: string;
    estimatedArrival: Date;
    distance: number;
    riderLocation: {
        lat: number;
        lng: number;
    };
}

export interface OrderTimeoutJobData {
    orderId: string;
    timeoutType: 'rider_assignment' | 'pickup' | 'delivery';
    timeoutMinutes: number;
}

export interface NotificationJobData {
    id: string;
    type: 'order' | 'delivery' | 'payment' | 'system';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    actions?: Array<{
        label: string;
        action: string;
        data?: any;
    }>;
    timestamp: string;
    expiresAt?: string;
    // Target information
    targetType: 'vendor' | 'customer' | 'rider' | 'admin';
    targetId: string;
    // Retry configuration
    maxRetries?: number;
    retryDelay?: number;
}