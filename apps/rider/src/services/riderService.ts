import apiClient from './api';

interface UpdateRiderStatusData {
    isOnline?: boolean;
    isAvailable?: boolean;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
    [key: string]: any;
}

const riderService = {
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
    }
};

export default riderService;