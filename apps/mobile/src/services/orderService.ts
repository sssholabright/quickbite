import { ApiResponse } from '../types/auth'
import { CreateOrderRequest, OrderFilters, OrderResponse } from '../types/order';
import apiClient from './api'

export const orderService = {
    createOrder: async (orderData: CreateOrderRequest) => {
        try {
            const res = await apiClient.post<ApiResponse<OrderResponse>>('/orders', orderData);
            return res.data.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    getOrders: async (filters?: OrderFilters) => {
        try {
            const params = new URLSearchParams();
            
            if (filters?.status) params.append('status', filters.status);
            if (filters?.vendorId) params.append('vendorId', filters.vendorId);
            if (filters?.customerId) params.append('customerId', filters.customerId);
            if (filters?.riderId) params.append('riderId', filters.riderId);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
            if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            const res = await apiClient.get<ApiResponse<{ orders: OrderResponse[]; total: number; page: number; limit: number }>>(`/orders?${params.toString()}`);
            return res.data.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    getOrderById: async (orderId: string) => {
        try {
            const res = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${orderId}`);
            return res.data.data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    updateOrderStatus: async (orderId: string, statusUpdate: { status: string; riderId?: string; estimatedDeliveryTime?: Date; notes?: string }) => {
        try {
            const res = await apiClient.patch<ApiResponse<OrderResponse>>(`/orders/${orderId}/status`, statusUpdate);
            return res.data.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    cancelOrder: async (orderId: string, reason?: string) => {
        try {
            const res = await apiClient.patch<ApiResponse<OrderResponse>>(`/orders/${orderId}/cancel`, { reason });
            return res.data.data;
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    }
};