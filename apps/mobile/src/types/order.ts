import { Animated } from "react-native";

export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type FilterType = 'all' | 'active' | 'past';

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface Order {
    id: string;
    orderId: string; // Display ID like #QB1234
    vendor: {
        id: string;
        name: string;
        logo?: string;
        location: string;
    };
    items: OrderItem[];
    status: OrderStatus;
    total: number;
    subtotal: number;
    fees: number;
    paymentMethod: 'cash' | 'card';
    paymentStatus: 'paid' | 'unpaid' | 'refunded';
    notes?: string;
    pickupTime: 'asap' | string; // 'asap' or scheduled time
    placedAt: Date;
    estimatedReadyAt?: Date;
    pickupCode?: string;
}

export interface OrderSummaryProps {
    items: OrderItem[];
    vendor: {
        name: string;
        distance: string;
        eta: string;
    };
    total: number;
}

export interface OrderCardProps {
    order: Order;
    onPress: () => void;
}

export interface OrderDetailScreenProps {
    order: Order;
    onBack: () => void;
}

export interface StatusStepProps {
    step: {
        key: string;
        label: string;
        icon: string;
        time: string;
    };
    currentStatus: OrderStatus;
    statusSteps: Array<{
        key: string;
        label: string;
        icon: string;
        time: string;
    }>;
    pulseAnim: Animated.Value;
}

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
    specialInstructions?: string;
}

export interface OrderItemRequest {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    addOns?: OrderItemAddOnRequest[];
}

export interface OrderItemAddOnRequest {
    addOnId: string;
    quantity: number;
}

export interface OrderResponse {
    id: string;
    orderNumber: string;
    status: string;
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
    };
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
    addOns?: OrderItemAddOnResponse[];
}

export interface OrderItemAddOnResponse {
    id: string;
    addOn: {
        id: string;
        name: string;
        description?: string;
        price: number;
        category: string;
    };
    quantity: number;
    price: number;
}

export interface OrderFilters {
    status?: string;
    vendorId?: string;
    customerId?: string;
    riderId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
}
