import { Animated } from "react-native";

export interface OrderSummaryProps {
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>
    vendor: {
        name: string;
        distance: string;
        eta: string;
    };
    total: number;
}

export interface StatusStepProps {
    step: {
        key: string;
        label: string;
        icon: string;
        time: string;
    };
    currentStatus: 'pending' | 'preparing' | 'ready' | 'picked';
    statusSteps: Array<{
        key: string;
        label: string;
        icon: string;
        time: string;
    }>;
    pulseAnim: Animated.Value;
}