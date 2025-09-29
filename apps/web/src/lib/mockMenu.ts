import { MenuItem, MenuCategory, MenuCategoryInfo, MenuAddOn } from '../types/menu'

// Menu categories
export const menuCategories: MenuCategoryInfo[] = [
    {
        id: 'MEALS',
        name: 'Meals',
        description: 'Main dishes and entrees',
        icon: '️',
        color: 'bg-orange-100 text-orange-800'
    },
    {
        id: 'DRINKS',
        name: 'Drinks',
        description: 'Beverages and refreshments',
        icon: '🥤',
        color: 'bg-blue-100 text-blue-800'
    },
    {
        id: 'SNACKS',
        name: 'Snacks',
        description: 'Quick bites and appetizers',
        icon: '🍿',
        color: 'bg-yellow-100 text-yellow-800'
    },
    {
        id: 'DESSERTS',
        name: 'Desserts',
        description: 'Sweet treats and desserts',
        icon: '🍰',
        color: 'bg-pink-100 text-pink-800'
    }
]

// Mock menu items with add-ons
export const mockMenuItems: MenuItem[] = [
    {
        id: '1',
        name: 'Jollof Rice with Chicken',
        description: 'Traditional Nigerian jollof rice served with grilled chicken, plantain, and coleslaw',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
        category: {
            id: 'MEALS',
            name: 'Meals',
            description: 'Main dishes and entrees',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
        },
        isAvailable: true,
        preparationTime: 25,
        addOns: [
            {
                id: 'addon-1',
                name: 'Extra Rice',
                description: 'Additional portion of jollof rice',
                price: 500,
                isRequired: false,
                maxQuantity: 2,
                category: 'EXTRA'
            },
            {
                id: 'addon-2',
                name: 'Extra Chicken',
                description: 'Additional piece of grilled chicken',
                price: 800,
                isRequired: false,
                maxQuantity: 3,
                category: 'EXTRA'
            },
            {
                id: 'addon-3',
                name: 'Extra Plantain',
                description: 'Additional fried plantain',
                price: 300,
                isRequired: false,
                maxQuantity: 2,
                category: 'SIDE'
            }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        name: 'Fried Rice with Beef',
        description: 'Flavorful fried rice with tender beef strips, mixed vegetables, and scrambled eggs',
        price: 2800,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        category: {
            id: 'MEALS',
            name: 'Meals',
            description: 'Main dishes and entrees',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
        },
        isAvailable: true,
        preparationTime: 20,
        addOns: [
            {
                id: 'addon-4',
                name: 'Extra Beef',
                description: 'Additional beef strips',
                price: 1000,
                isRequired: false,
                maxQuantity: 2,
                category: 'EXTRA'
            },
            {
                id: 'addon-5',
                name: 'Extra Egg',
                description: 'Additional scrambled egg',
                price: 200,
                isRequired: false,
                maxQuantity: 2,
                category: 'EXTRA'
            }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '3',
        name: 'Coca Cola',
        description: 'Refreshing Coca Cola soft drink',
        price: 300,
        image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
        category: {
            id: 'DRINKS',
            name: 'Drinks',
            description: 'Beverages and refreshments',
            image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
        },
        isAvailable: true,
        preparationTime: 2,
        addOns: [
            {
                id: 'addon-6',
                name: 'Large Size',
                description: 'Upgrade to large bottle (500ml)',
                price: 200,
                isRequired: false,
                maxQuantity: 1,
                category: 'SIZE'
            },
            {
                id: 'addon-7',
                name: 'Extra Ice',
                description: 'Additional ice cubes',
                price: 50,
                isRequired: false,
                maxQuantity: 1,
                category: 'CUSTOMIZATION'
            }
        ],
        createdAt: '2024-01-15T11:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z'
    },
    {
        id: '4',
        name: 'Chicken Wings',
        description: 'Crispy fried chicken wings with spicy sauce',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400&h=300&fit=crop',
        category: {
            id: 'SNACKS',
            name: 'Snacks',
            description: 'Quick bites and appetizers',
            image: 'https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400&h=300&fit=crop',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
        },
        isAvailable: true,
        preparationTime: 15,
        addOns: [
            {
                id: 'addon-8',
                name: 'Extra Wings',
                description: 'Additional 2 pieces of chicken wings',
                price: 600,
                isRequired: false,
                maxQuantity: 3,
                category: 'EXTRA'
            },
            {
                id: 'addon-9',
                name: 'Extra Spicy',
                description: 'Make it extra spicy',
                price: 100,
                isRequired: false,
                maxQuantity: 1,
                category: 'CUSTOMIZATION'
            }
        ],
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z'
    }
]

// Helper function to format Naira currency
export const formatNaira = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG')}`
}
