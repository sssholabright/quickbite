import api from './api'
import { ApiOrderResponse, Order, OrderFilters, OrderStats } from '../types/order'

function logError(error: any, context: string) {
    console.error(`[OrderService] ${context}:`, error?.response?.data || error?.message || error)
}

export class OrderService {
    // Get orders with filters
    static async getOrders(filters?: OrderFilters): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
        try {
            const params = new URLSearchParams()
            
            if (filters?.status) params.append('status', filters.status)
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
            if (filters?.dateTo) params.append('dateTo', filters.dateTo)
            if (filters?.search) params.append('search', filters.search)

            const response = await api.get(`/orders?${params.toString()}`)
            return {
                orders: response.data.data.orders.map(this.transformOrderResponse),
                total: response.data.data.total,
                page: response.data.data.page,
                limit: response.data.data.limit
            }
        } catch (error) {
            logError(error, 'getOrders')
            throw error
        }
    }

    // Get order by ID
    static async getOrderById(orderId: string): Promise<Order> {
        try {
            const response = await api.get(`/orders/${orderId}`)
            return this.transformOrderResponse(response.data.data)
        } catch (error) {
            logError(error, 'getOrderById')
            throw error
        }
    }

    // Update order status
    static async updateOrderStatus(orderId: string, statusUpdate: {
        status: string
        riderId?: string
        estimatedDeliveryTime?: Date
        notes?: string
    }): Promise<Order> {
        try {
            const response = await api.patch(`/orders/${orderId}/status`, statusUpdate)
            return this.transformOrderResponse(response.data.data)
        } catch (error) {
            logError(error, 'updateOrderStatus')
            throw error
        }
    }

    // Cancel order
    static async cancelOrder(orderId: string, reason?: string): Promise<Order> {
        try {
            const response = await api.patch(`/orders/${orderId}/cancel`, { reason })
            return this.transformOrderResponse(response.data.data)
        } catch (error) {
            logError(error, 'cancelOrder')
            throw error
        }
    }

    // Get order statistics
    static async getOrderStats(): Promise<OrderStats> {
        try {
            // This would typically be a separate endpoint
            // For now, we'll calculate stats from the orders
            const response = await api.get('/orders')
            const orders = response.data.data.orders || []
            
            const stats: OrderStats = {
                pending: orders.filter((o: ApiOrderResponse) => o.status === 'PENDING').length,
                preparing: orders.filter((o: ApiOrderResponse) => ['CONFIRMED', 'PREPARING'].includes(o.status)).length,
                ready: orders.filter((o: ApiOrderResponse) => o.status === 'READY_FOR_PICKUP').length,
                delivered: orders.filter((o: ApiOrderResponse) => o.status === 'DELIVERED').length,
                cancelled: orders.filter((o: ApiOrderResponse) => o.status === 'CANCELLED').length
            }
            
            return stats
        } catch (error) {
            logError(error, 'getOrderStats')
            throw error
        }
    }

    // Transform API response to frontend format
    private static transformOrderResponse(apiOrder: ApiOrderResponse): Order {
        return {
            id: apiOrder.id,
            orderNumber: apiOrder.orderNumber,
            customerId: apiOrder.customer.id,
            customerName: apiOrder.customer.name,
            customerPhone: apiOrder.customer.phone,
            status: apiOrder.status as any,
            items: apiOrder.items.map(item => {
                return {
                    id: item.id,
                    menuItemId: item.menuItem.id,
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    specialInstructions: item.specialInstructions,
                    addOns: item.addOns
                }
            }),
            subtotal: apiOrder.pricing.subtotal,
            deliveryFee: apiOrder.pricing.deliveryFee,
            serviceFee: apiOrder.pricing.serviceFee,
            total: apiOrder.pricing.total,
            deliveryAddress: {
                title: apiOrder.deliveryAddress.label,
                address: apiOrder.deliveryAddress.address,
                city: apiOrder.deliveryAddress.city,
                state: apiOrder.deliveryAddress.state,
                country: 'Nigeria',
                lat: apiOrder.deliveryAddress.coordinates.lat,
                lng: apiOrder.deliveryAddress.coordinates.lng
            },
            specialInstructions: apiOrder.specialInstructions,
            rider: apiOrder.rider ? {
                id: apiOrder.rider.id,
                name: apiOrder.rider.name,
                phone: apiOrder.rider.phone,
                vehicleType: apiOrder.rider.vehicleType as any,
                rating: 4.5 // Default rating, should come from API
            } : undefined,
            estimatedDeliveryTime: apiOrder.estimatedDeliveryTime,
            createdAt: apiOrder.createdAt,
            updatedAt: apiOrder.updatedAt
        }
    }
}