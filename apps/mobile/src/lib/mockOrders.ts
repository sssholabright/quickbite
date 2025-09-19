import { Order } from '../types/order';

export const mockOrders: Order[] = [
    {
        id: '1',
        orderId: 'QB1234',
        vendor: {
            id: 'vendor1',
            name: 'Mama Nkechi\'s Kitchen',
            logo: 'https://via.placeholder.com/50',
            location: 'Block A, Room 12'
        },
        items: [
            { id: '1', name: 'Jollof Rice', price: 1200, quantity: 2 },
            { id: '2', name: 'Fried Chicken', price: 800, quantity: 1 }
        ],
        status: 'out_for_delivery',
        total: 3200,
        subtotal: 3200,
        fees: 0,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        notes: 'Less spicy please',
        pickupTime: 'asap',
        placedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        estimatedReadyAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        pickupCode: '4721'
    },
    {
        id: '2',
        orderId: 'QB1233',
        vendor: {
            id: 'vendor2',
            name: 'Uncle Tunde\'s Spot',
            logo: 'https://via.placeholder.com/50',
            location: 'Block B, Room 8'
        },
        items: [
            { id: '3', name: 'Pounded Yam', price: 1500, quantity: 1 },
            { id: '4', name: 'Egusi Soup', price: 1000, quantity: 1 }
        ],
        status: 'preparing',
        total: 2500,
        subtotal: 2500,
        fees: 0,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        pickupTime: 'asap',
        placedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        estimatedReadyAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        pickupCode: '8934'
    },
    {
        id: '3',
        orderId: 'QB1232',
        vendor: {
            id: 'vendor1',
            name: 'Mama Nkechi\'s Kitchen',
            logo: 'https://via.placeholder.com/50',
            location: 'Block A, Room 12'
        },
        items: [
            { id: '5', name: 'Fried Rice', price: 1000, quantity: 1 }
        ],
        status: 'delivered',
        total: 1000,
        subtotal: 1000,
        fees: 0,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        pickupTime: 'asap',
        placedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        pickupCode: '1567'
    },
    {
        id: '4',
        orderId: 'QB1231',
        vendor: {
            id: 'vendor3',
            name: 'Aunty Grace\'s Place',
            logo: 'https://via.placeholder.com/50',
            location: 'Block C, Room 5'
        },
        items: [
            { id: '6', name: 'Beans & Plantain', price: 800, quantity: 1 },
            { id: '7', name: 'Fish Stew', price: 1200, quantity: 1 }
        ],
        status: 'cancelled',
        total: 2000,
        subtotal: 2000,
        fees: 0,
        paymentMethod: 'cash',
        paymentStatus: 'refunded',
        pickupTime: 'asap',
        placedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    }
];
