import apiClient from './api';

interface UpdatePushTokenData {
    pushToken: string;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
    [key: string]: any;
}

const customerService = {
    // Update customer push token
    async updatePushToken(pushToken: string): Promise<any> {
        try {
            const response = await apiClient.patch<ApiResponse<any>>('/customers/push-token', {
                pushToken
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update push token');
        }
    },

    // Get customer push token
    async getPushToken(): Promise<any> {
        try {
            const response = await apiClient.get<ApiResponse<any>>('/customers/push-token');
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get push token');
        }
    },
};

export default customerService;