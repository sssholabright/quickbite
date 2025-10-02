export interface OrderFilters {
    search?: string;
    status?: string;
    date?: string;
    vendorId?: string;
    riderId?: string;
    customerId?: string;
}

export interface OrderSort {
    field: 'createdAt' | 'updatedAt' | 'total' | 'status';
    direction: 'asc' | 'desc';
}

export interface OrdersListParams {
    page?: number;
    limit?: number;
    filters?: OrderFilters;
    sort?: OrderSort;
}

export interface OrderListItem {
    id: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        email: string;
    };
    vendor: {
        id: string;
        name: string;
        businessName: string;
        phone: string;
    };
    rider?: {
        id: string;
        name: string;
        phone: string;
        vehicleType: string;
    } | undefined;
    status: string;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
    deliveryAddress: any;
    specialInstructions?: string | undefined;
    estimatedDeliveryTime?: string | undefined;
    cancelledAt?: string | undefined;
    cancellationReason?: string | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface OrdersListResponse {
    data: OrderListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ReassignRiderRequest {
    newRiderId: string;
    reason?: string;
}

export interface CancelOrderRequest {
    reason: string;
    refundAmount?: number;
}

export interface RefundOrderRequest {
    amount: number;
    reason: string;
    refundType?: 'FULL' | 'PARTIAL';
}

export interface OrderActionResponse {
    success: boolean;
    message: string;
    order?: OrderListItem;
}

export interface RiderOption {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    isOnline: boolean;
    isAvailable: boolean;
}
