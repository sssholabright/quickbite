// 🚀 UNIFIED: Single data structure for orders, matching backend shape

export interface UnifiedOrder {
    id: string;
    orderId: string; // For compatibility with backend
    orderNumber: string;
    vendor: {
        id?: string;
        name?: string;
        phone?: string;
        pickupLocation?: string;
        address?: string; // Alias for pickupLocation
        lat: number;
        lng: number;
    };
    customer: {
        id?: string;
        name?: string;
        phone?: string;
        address: string;
        dropoffAddress: string; // Alias for address
        lat: number;
        lng: number;
        dropoffLat: number; // Alias for lat
        dropoffLng: number; // Alias for lng
    };
    deliveryAddress: {
        address: string;
        city?: string;
        state?: string;
        label?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
        [key: string]: any;
    };
    deliveryFee: number;
    payout: number; // Alias for deliveryFee
    estimatedDistance: number;
    distanceKm: number; // Alias for estimatedDistance
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        unitPrice?: number;
        totalPrice?: number;
        specialInstructions?: string;
    }>;
    createdAt: string; // ISO string from backend
    expiresIn: number; // seconds
    timer: number; // seconds
}

// 🚀 BACKWARD COMPATIBILITY: Keep existing types but make them aliases
export type RiderOrderItem = UnifiedOrder['items'][0];

export type RiderAvailableOrder = UnifiedOrder;

export type DeliveryJob = UnifiedOrder;

export type AvailableOrderCardProps = {
    order: UnifiedOrder;
    onPress: () => void;
};