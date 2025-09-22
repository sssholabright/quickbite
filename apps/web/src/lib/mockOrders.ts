import { Order, OrderStats } from '../types/order'

// Mock orders data
export const mockOrders: Order[] = [
    {
        id: '1',
        orderNumber: '#QB-001',
        customerId: 'customer-1',
        customerName: 'John Doe',
        customerPhone: '+234 801 234 5678',
        status: 'PENDING',
        items: [
            {
                id: 'item-1',
                menuItemId: 'menu-1',
                name: 'Jollof Rice with Chicken',
                quantity: 2,
                unitPrice: 2500,
                totalPrice: 5000,
                specialInstructions: 'Extra spicy'
            },
            {
                id: 'item-2',
                menuItemId: 'menu-2',
                name: 'Fried Plantain',
                quantity: 1,
                unitPrice: 1500,
                totalPrice: 1500
            }
        ],
        subtotal: 6500,
        deliveryFee: 500,
        serviceFee: 200,
        total: 7200,
        deliveryAddress: {
            title: 'Home',
            address: '123 Victoria Island, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        specialInstructions: 'Please call when you arrive',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
        id: '2',
        orderNumber: '#QB-002',
        customerId: 'customer-2',
        customerName: 'Jane Smith',
        customerPhone: '+234 802 345 6789',
        status: 'CONFIRMED',
        items: [
            {
                id: 'item-3',
                menuItemId: 'menu-3',
                name: 'Pounded Yam with Egusi Soup',
                quantity: 1,
                unitPrice: 3500,
                totalPrice: 3500
            }
        ],
        subtotal: 3500,
        deliveryFee: 500,
        serviceFee: 150,
        total: 4150,
        deliveryAddress: {
            title: 'Office',
            address: '456 Ikoyi, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
        id: '3',
        orderNumber: '#QB-003',
        customerId: 'customer-3',
        customerName: 'Mike Johnson',
        customerPhone: '+234 803 456 7890',
        status: 'PREPARING',
        items: [
            {
                id: 'item-4',
                menuItemId: 'menu-4',
                name: 'Beef Suya',
                quantity: 3,
                unitPrice: 2000,
                totalPrice: 6000
            },
            {
                id: 'item-5',
                menuItemId: 'menu-5',
                name: 'Chapman Drink',
                quantity: 2,
                unitPrice: 800,
                totalPrice: 1600
            }
        ],
        subtotal: 7600,
        deliveryFee: 500,
        serviceFee: 250,
        total: 8350,
        deliveryAddress: {
            title: 'Home',
            address: '789 Surulere, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        rider: {
            id: 'rider-1',
            name: 'Ahmed Musa',
            phone: '+234 804 567 8901',
            vehicleType: 'MOTORCYCLE',
            rating: 4.8
        },
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
        updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    {
        id: '4',
        orderNumber: '#QB-004',
        customerId: 'customer-4',
        customerName: 'Sarah Williams',
        customerPhone: '+234 805 678 9012',
        status: 'READY_FOR_PICKUP',
        items: [
            {
                id: 'item-6',
                menuItemId: 'menu-6',
                name: 'Pepper Soup',
                quantity: 1,
                unitPrice: 3000,
                totalPrice: 3000
            }
        ],
        subtotal: 3000,
        deliveryFee: 500,
        serviceFee: 120,
        total: 3620,
        deliveryAddress: {
            title: 'Home',
            address: '321 Lekki, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        rider: {
            id: 'rider-2',
            name: 'Ibrahim Ali',
            phone: '+234 806 789 0123',
            vehicleType: 'BIKE',
            rating: 4.9
        },
        createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
        id: '5',
        orderNumber: '#QB-005',
        customerId: 'customer-5',
        customerName: 'David Brown',
        customerPhone: '+234 807 890 1234',
        status: 'DELIVERED',
        items: [
            {
                id: 'item-7',
                menuItemId: 'menu-7',
                name: 'Amala with Ewedu',
                quantity: 2,
                unitPrice: 2800,
                totalPrice: 5600
            }
        ],
        subtotal: 5600,
        deliveryFee: 500,
        serviceFee: 200,
        total: 6300,
        deliveryAddress: {
            title: 'Home',
            address: '654 Gbagada, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        rider: {
            id: 'rider-3',
            name: 'Oluwaseun Adebayo',
            phone: '+234 808 901 2345',
            vehicleType: 'CAR',
            rating: 4.7
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '6',
        orderNumber: '#QB-006',
        customerId: 'customer-6',
        customerName: 'Grace Okafor',
        customerPhone: '+234 809 012 3456',
        status: 'CANCELLED',
        items: [
            {
                id: 'item-8',
                menuItemId: 'menu-8',
                name: 'Fried Rice with Fish',
                quantity: 1,
                unitPrice: 3200,
                totalPrice: 3200
            }
        ],
        subtotal: 3200,
        deliveryFee: 500,
        serviceFee: 150,
        total: 3850,
        deliveryAddress: {
            title: 'Home',
            address: '987 Yaba, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
        },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        updatedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    }
]

// Mock order statistics
export const mockOrderStats: OrderStats = {
    pending: 1,
    preparing: 1,
    ready: 1,
    delivered: 1,
    cancelled: 1
}

// Helper function to format Naira
export const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`
}
