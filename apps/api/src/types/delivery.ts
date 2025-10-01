export interface RiderMatch {
    riderId: string;
    distance: number;
    latitude: number;
    longitude: number;
    rating: number;
    completedOrders: number;
}

// 🚀 STANDARDIZED: Unified delivery job data structure
export interface DeliveryJobData {
    orderId: string;
    orderNumber: string;
    vendorId: string;
    vendorName: string;
    customerId: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string | object; // Can be string or object
    deliveryFee: number;
    totalAmount: number;
    estimatedDistance: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: Date;
    expiresAt: Date;
    expiresIn: number; // seconds until expiry
    timer: number; // seconds - countdown timer
    retryCount?: number;
}

// 🚀 NEW: Standardized delivery job broadcast format
export interface DeliveryJobBroadcast extends DeliveryJobData {
    // Additional fields for broadcasting
    priority: 'low' | 'normal' | 'high' | 'urgent';
    broadcastId: string; // Unique ID for this broadcast
}