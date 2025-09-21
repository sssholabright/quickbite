export interface User {
    id: string | undefined;
    name: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    avatar?: string | undefined;
}

export interface Address {
    id: string;
    label: string;
    address: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    isDefault: boolean;
    landmark?: string;
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'wallet';
    name: string;
    lastFour?: string;
    isDefault: boolean;
    balance?: number;
}

export interface Settings {
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
    preferences: {
        language: string;
        defaultAddress?: string;
    };
}
