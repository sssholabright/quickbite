export interface CreateOrderRequest {
    vendorId: string;
    items: OrderItemRequest[];
    deliveryAddress: {
        label: string;
        address: string;
        city: string;
        state: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    specialInstructions?: string | undefined;
}
  
export interface OrderItemRequest {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string | undefined;
}

export interface OrderResponse {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    vendor: {
        id: string;
        name: string;
        businessName: string;
        address: string;
        phone: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    rider?: {  
        id: string;
        name: string;
        phone: string;
        vehicleType: string;
    } | undefined;
    items: OrderItemResponse[];
    deliveryAddress: {
        label: string;
        address: string;
        city: string;
        state: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    pricing: {
        subtotal: number;
        deliveryFee: number;
        serviceFee: number;
        total: number;
    };
    specialInstructions?: string;
    estimatedDeliveryTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
  
export interface OrderItemResponse {
    id: string;
    menuItem: {
        id: string;
        name: string;
        description?: string;
        price: number;
        image?: string;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
}
  
export interface OrderStatusUpdate {
    status: OrderStatus;
    riderId?: string | undefined;
    estimatedDeliveryTime?: Date | undefined;
    notes?: string | undefined;
}
  
export type OrderStatus = 
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY_FOR_PICKUP'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  
export interface OrderFilters {
    status?: OrderStatus | undefined;
    vendorId?: string | undefined;
    customerId?: string | undefined;
    riderId?: string | undefined;
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}