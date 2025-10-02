import { ApiResponse } from '../types/auth';
import { 
    OrdersListResponse, 
    OrdersListParams, 
    ReassignRiderRequest, 
    CancelOrderRequest, 
    RefundOrderRequest,
    OrderActionResponse,
    RiderOption,
    OrderListItem,
    OrderSort 
} from '../types/orders';
import api from './api';

class OrdersService {
    // Get orders list with pagination, filters, and sorting
    async getOrdersList(params: OrdersListParams): Promise<OrdersListResponse> {
        try {
            const response = await api.get<ApiResponse<OrdersListResponse>>('/orders', { params });
            return response.data.data as OrdersListResponse;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get orders list');
        }
    }

    // Get available riders for reassignment
    async getAvailableRiders(): Promise<RiderOption[]> {
        try {
            const response = await api.get<ApiResponse<RiderOption[]>>('/riders/available');
            return response.data.data as RiderOption[];
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get available riders');
        }
    }

    // Reassign rider to order
    async reassignRider(orderId: string, request: ReassignRiderRequest): Promise<OrderActionResponse> {
        try {
            const response = await api.post<ApiResponse<OrderActionResponse>>(
                `/orders/${orderId}/reassign`, 
                request
            );
            return response.data.data as OrderActionResponse;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reassign rider');
        }
    }

    // Cancel order
    async cancelOrder(orderId: string, request: CancelOrderRequest): Promise<OrderActionResponse> {
        try {
            const response = await api.post<ApiResponse<OrderActionResponse>>(
                `/orders/${orderId}/cancel`, 
                request
            );
            return response.data.data as OrderActionResponse;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to cancel order');
        }
    }

    // Refund order
    async refundOrder(orderId: string, request: RefundOrderRequest): Promise<OrderActionResponse> {
        try {
            const response = await api.post<ApiResponse<OrderActionResponse>>(
                `/orders/${orderId}/refund`, 
                request
            );
            return response.data.data as OrderActionResponse;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to process refund');
        }
    }

    // Get single order details
    async getOrderDetails(orderId: string): Promise<OrderListItem> {
        try {
            const response = await api.get<ApiResponse<OrderListItem>>(`/orders/${orderId}`);
            return response.data.data as OrderListItem;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get order details');
        }
    }
}

export const ordersService = new OrdersService();