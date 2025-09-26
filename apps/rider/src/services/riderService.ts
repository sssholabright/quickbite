import apiClient from './api';

interface UpdateRiderStatusData {
    isOnline?: boolean;
    isAvailable?: boolean;
}

interface UpdateRiderLocationData {
    latitude: number;
    longitude: number;
}

interface AcceptDeliveryJobData {
    orderId: string;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
    [key: string]: any;
}

const riderService = {
    // Existing methods
    async updateRiderStatus(data: UpdateRiderStatusData): Promise<any> {
        try {
            const response = await apiClient.put<ApiResponse<any>>('/riders/status', data);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update rider status');
        }
    },

    async getRiderStatus(): Promise<any> {
        try {
            const response = await apiClient.get<ApiResponse<any>>('/riders/status');
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get rider status');
        }
    },

    // 🚀 NEW: Update rider location
    async updateRiderLocation(data: UpdateRiderLocationData): Promise<any> {
        try {
            const response = await apiClient.put<ApiResponse<any>>('/riders/location', data);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update rider location');
        }
    },

    // 🚀 NEW: Accept delivery job
    async acceptDeliveryJob(orderId: string): Promise<any> {
        try {
            const response = await apiClient.post<ApiResponse<any>>(`/riders/delivery-jobs/${orderId}/accept`);
            return response.data.data;
        } catch (error: any) {
            // If the order is already assigned, remove it from the local store
            if (error.response?.data?.message?.includes('already assigned')) {
                console.log(`Order ${orderId} already assigned, removing from local store`);
                // This will be handled by the WebSocket event, but we can also handle it here
            }
            throw new Error(error.response?.data?.message || 'Failed to accept delivery job');
        }
    },

    // 🚀 NEW: Reject delivery job
    async rejectDeliveryJob(orderId: string): Promise<any> {
        try {
            const response = await apiClient.post<ApiResponse<any>>(`/riders/delivery-jobs/${orderId}/reject`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reject delivery job');
        }
    },

    // 🚀 NEW: Update order status
    async updateOrderStatus(orderId: string, status: string): Promise<any> {
        try {
            const response = await apiClient.put<ApiResponse<any>>(`/orders/${orderId}/status`, {
                status
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update order status');
        }
    },

    // 🚀 NEW: Mark order as picked up
    async markOrderPickedUp(orderId: string): Promise<any> {
        try {
            const response = await apiClient.patch<ApiResponse<any>>(`/orders/${orderId}/status`, {
                status: 'PICKED_UP'
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to mark order as picked up');
        }
    },

    // 🚀 NEW: Mark order as delivered
    async markOrderDelivered(orderId: string): Promise<any> {
        try {
            const response = await apiClient.patch<ApiResponse<any>>(`/orders/${orderId}/status`, {
                status: 'DELIVERED'
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to mark order as delivered');
        }
    },

    // 🚀 NEW: Cancel order (for already accepted orders)
    async cancelOrder(orderId: string, reason?: string): Promise<any> {
        try {
            const response = await apiClient.patch<ApiResponse<any>>(`/orders/${orderId}/cancel`, {
                reason: reason || 'Rider cancelled order'
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to cancel order');
        }
    },

    // 🚀 UPDATED: Get rider's assigned orders with proper filtering
    async getRiderOrders(): Promise<any> {
        try {
            console.log('🔍 Fetching rider orders...');
            
            // Use the orders endpoint with rider filter to get assigned orders
            const response = await apiClient.get<ApiResponse<any>>('/orders', {
                params: {
                    status: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'], // Only undelivered orders
                    limit: 50 // Get more orders
                    // Note: riderId filter is automatically applied by the backend based on the authenticated user
                }
            });
            
            console.log('📦 Raw API response:', JSON.stringify(response.data, null, 2));
            
            return response.data.data;
        } catch (error: any) {
            console.error('❌ API Error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Failed to get rider orders');
        }
    },

    // 🚀 NEW: Get order details
    async getOrderDetails(orderId: string): Promise<any> {
        try {
            const response = await apiClient.get<ApiResponse<any>>(`/orders/${orderId}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get order details');
        }
    },

    // 🚀 NEW: Update push token
    async updatePushToken(pushToken: string): Promise<any> {
        try {
            const response = await apiClient.patch<ApiResponse<any>>('/riders/push-token', {
                pushToken
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update push token');
        }
    },
};

export default riderService;