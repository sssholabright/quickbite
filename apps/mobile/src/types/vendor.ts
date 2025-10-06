import { StyleProp, ViewStyle } from "react-native";

export interface Vendor {
    id: string;
    name: string;
    description: string;
    image: string;
    rating: number;
    eta: string;
    distance: string;
    category: string;
    isOpen: boolean;
    featured: boolean;
    openingTime?: string | null;
    closingTime?: string | null;
    operatingDays?: string[];
    categories?: Array<{
        id: string;
        name: string;
        description?: string;
        image?: string;
    }>;
}
  
export interface Meal {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    vendorId: string;
    vendorName?: string; // Add this
    category: string;
    popular: boolean;
    preparationTime: number;
    discount?: number;
    reviewCount?: number;
    rating?: number;
    isAvailable?: boolean;
}
  
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
    placeholder?: string;
    style?: object; // or ViewStyle from react-native
}

export interface VendorCardProps {
    vendor: Vendor;
    onPress: () => void;
}

export interface CategoryChipProps {
    category: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
    isSelected: boolean;
    onPress: () => void;
}

export interface MealCardProps {
    meal: Meal;
    onPress?: () => void;
    onAddToCart?: () => void;
    onRemoveFromCart?: () => void;
    quantity?: number;
}

export interface PromoBannerProps {
    title: string;
    subtitle: string;
    onPress: () => void;
}

export interface MealGridCardProps {
    meal: Meal;
    onAddToCart: () => void;
    onRemoveFromCart: () => void;
    quantity: number;
    isOpen: boolean;
}

export interface MealListCardProps {
    meal: Meal;
    onAddToCart: () => void;
    onRemoveFromCart: () => void;
    quantity: number;
    isOpen: boolean;
}

export interface CartBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    cartItems: Record<string, number>;
    onUpdateQuantity: (mealId: string, quantity: number) => void;
    onRemoveItem: (mealId: string) => void;
    onProceedToCheckout: () => void;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    vendorId: string;
    vendorName: string;
}

export interface CartScreenProps {
    visible: boolean;
    onClose: () => void;
    cartItems: Record<string, number>;
    onUpdateQuantity: (mealId: string, quantity: number) => void;
    onRemoveItem: (mealId: string) => void;
}

export interface CheckoutScreenProps {
    route: {
        params: {
            cartItems: Record<string, number>;
            vendorId: string;
        };
    };
}

// Update the PublicVendor interface to include categories
export interface PublicVendor {
    id: string;
    businessName: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    rating: number;
    isOpen: boolean;
    openingTime?: string | null;
    closingTime?: string | null;
    operatingDays?: string[];
    latitude?: number;
    longitude?: number;
    categories?: Array<{
        id: string;
        name: string;
        description?: string;
        image?: string;
    }>;
    menuItemsCount?: number;
    user?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
}