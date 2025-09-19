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