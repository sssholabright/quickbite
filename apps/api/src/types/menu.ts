export interface MenuItemData {
    name: string;
    description?: string | undefined;
    price: number;
    image?: string | undefined;
    categoryId: string;
    preparationTime?: number;
    addOns?: MenuAddOnData[];
}

export interface MenuAddOnData {
    name: string;
    description?: string | undefined;
    price: number;
    isRequired?: boolean;
    maxQuantity?: number;
    category: 'EXTRA' | 'SIZE' | 'SIDE' | 'CUSTOMIZATION';
}

export interface UpdateMenuItemData {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    image?: string | undefined;
    categoryId?: string | undefined;
    isAvailable?: boolean | undefined;
    preparationTime?: number | undefined;
    addOns?: MenuAddOnData[] | undefined;
}

export interface CategoryData {
    name: string;
    description?: string | undefined;
    image?: string | undefined;
}