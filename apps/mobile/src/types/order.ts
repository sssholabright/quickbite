import { Animated } from "react-native";

export type OrderStatus = 
    | 'pending'
    | 'confirmed' 
    | 'preparing'
    | 'ready_for_pickup'
    | 'assigned'        // Add this
    | 'picked_up'       // Add this
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
export type FilterType = 'all' | 'active' | 'past';

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    addOns?: Array<{
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
    }>;
}

export interface Order {
    id: string;
    orderId: string; // Display ID like #QB1234
    vendor: {
        id: string;
        name: string;
        businessName: string; // 🚀 ADD: Include business name
        logo?: string; // 🚀 ENHANCED: Include vendor logo
        address?: string; // 🚀 ADD: Include vendor address
        phone?: string; // 🚀 ADD: Include vendor phone
        coordinates?: { // 🚀 ADD: Include vendor coordinates
            lat: number;
            lng: number;
        };
    };
    customer?: { // 🚀 ADD: Include customer info
        id: string;
        name: string;
        phone: string;
    };
    rider?: { // 🚀 ADD: Include rider info
        id: string;
        name: string;
        phone: string;
    };
    items: OrderItem[];
    status: OrderStatus;
    // 🚀 ADD: New properties for enhanced status display
    statusDisplayText?: string;
    statusColor?: string;
    isRealtime?: boolean;
    total: number;
    subtotal: number;
    fees: number;
    deliveryFee: number; // 🚀 ADD: Separate delivery fee
    serviceFee: number; // 🚀 ADD: Separate service fee
    deliveryAddress?: { // 🚀 ADD: Include delivery address
        city?: string;
        label?: string;
        state?: string;
        address?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    paymentMethod: 'cash' | 'card';
    paymentStatus: 'paid' | 'unpaid' | 'refunded';
    estimatedDeliveryTime?: Date;
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderSummaryProps {
    items: OrderItem[];
    vendor: {
        name: string;
        distance: string;
        logo?: string;
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
        logo?: string;
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
