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
}
  
export interface Meal {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    vendorId: string;
    category: string;
    popular: boolean;
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
    onPress: () => void;
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
}

export interface MealListCardProps {
    meal: Meal;
    onAddToCart: () => void;
    onRemoveFromCart: () => void;
    quantity: number;
}

export interface CartBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    cartItems: Record<string, number>;
    onUpdateQuantity: (mealId: string, quantity: number) => void;
    onRemoveItem: (mealId: string) => void;
    onProceedToCheckout: () => void;
}

export interface CheckoutScreenProps {
    route: {
        params: {
            cartItems: Record<string, number>;
            vendorId: string;
        };
    };
}