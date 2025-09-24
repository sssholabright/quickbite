export interface RiderMatch {
    riderId: string;
    distance: number;
    latitude: number;
    longitude: number;
    rating: number;
    completedOrders: number;
    isAvailable: boolean;
}

export interface DeliveryJobBroadcast {
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
    expiresAt: Date;
    timer: number; // seconds
    retryCount: number;
}