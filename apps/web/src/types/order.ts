export interface OrderItem {
    id: string
    menuItemId: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    specialInstructions?: string
    addOns?: Array<{
        id: string
        addOn: {
            id: string
            name: string
            description?: string
            price: number
            category: string
        }
        quantity: number
        price: number
    }>
}

export interface DeliveryAddress {
    title: string
    address: string
    city?: string
    state?: string
    country: string
    lat?: number
    lng?: number
}

export interface Rider {
    id: string
    name: string
    phone?: string
    vehicleType: 'BIKE' | 'CAR' | 'MOTORCYCLE'
    rating: number
}

export type OrderStatus = 
    | 'PENDING'
    | 'CONFIRMED' 
    | 'PREPARING'
    | 'READY_FOR_PICKUP'
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'

export interface Order {
    id: string
    orderNumber: string
    customerId: string
    customerName: string
    customerPhone?: string
    status: OrderStatus
    items: OrderItem[]
    subtotal: number
    deliveryFee: number
    serviceFee: number
    total: number
    deliveryAddress: DeliveryAddress
    specialInstructions?: string
    rider?: Rider
    estimatedDeliveryTime?: string
    createdAt: string
    updatedAt: string
}

export interface OrderStats {
    pending: number
    preparing: number
    ready: number
    delivered: number
    cancelled: number
}

export interface OrderFilters {
    status?: OrderStatus
    dateFrom?: string
    dateTo?: string
    search?: string
    searchType?: 'orderId' | 'customerName' | 'riderName' | 'all'
    sortBy?: 'createdAt' | 'status' | 'total' | 'priority'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

// 🚀 NEW: Priority order for auto-sorting
export const ORDER_PRIORITY: Record<OrderStatus, number> = {
    'PENDING': 1,
    'CONFIRMED': 2,
    'PREPARING': 3,
    'READY_FOR_PICKUP': 4,
    'ASSIGNED': 5,
    'PICKED_UP': 6,
    'OUT_FOR_DELIVERY': 7,
    'DELIVERED': 8,
    'CANCELLED': 9
}

export interface ApiOrderResponse {
    id: string
    orderNumber: string
    status: string
    vendor: {
        id: string
        name: string
        businessName: string
        address: string
        phone: string
        coordinates: {
            lat: number
            lng: number
        }
    }
    customer: {
        id: string
        name: string
        phone: string
    }
    rider?: {
        id: string
        name: string
        phone: string
        vehicleType: string
        rating: number
    }
    items: Array<{
        id: string
        menuItem: {
            id: string
            name: string
            description?: string
            price: number
            image?: string
        }
        quantity: number
        unitPrice: number
        totalPrice: number
        specialInstructions?: string
        addOns?: Array<{
            id: string
            addOn: {
                id: string
                name: string
                description?: string
                price: number
                category: string
            }
            quantity: number
            price: number
        }>
    }>
    deliveryAddress: {
        label: string
        address: string
        city: string
        state: string
        coordinates: {
            lat: number
            lng: number
        }
    }
    pricing: {
        subtotal: number
        deliveryFee: number
        serviceFee: number
        total: number
    }
    specialInstructions?: string
    estimatedDeliveryTime?: string
    createdAt: string
    updatedAt: string
}