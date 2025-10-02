import { 
    RidersListParams, 
    RidersListResponse, 
    RiderDetails,
    CreateRiderRequest,
    UpdateRiderRequest,
    ActionResponse
} from '../types/logistics';
import api from './api';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

class RidersService {
    async getRidersList(params: RidersListParams): Promise<RidersListResponse> {
        try {
            const response = await api.get<ApiResponse<RidersListResponse>>('/riders', {
                params
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch riders');
        }
    }

    async getRiderDetails(riderId: string): Promise<RiderDetails> {
        try {
            const response = await api.get<ApiResponse<RiderDetails>>(`/riders/${riderId}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch rider details');
        }
    }

    async createRider(request: CreateRiderRequest): Promise<RiderDetails> {
        try {
            const response = await api.post<ApiResponse<RiderDetails>>('/riders', request);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create rider');
        }
    }

    async updateRider(riderId: string, request: UpdateRiderRequest): Promise<RiderDetails> {
        try {
            const response = await api.put<ApiResponse<RiderDetails>>(`/riders/${riderId}`, request);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update rider');
        }
    }

    async suspendRider(riderId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/riders/${riderId}/suspend`, {
                reason
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to suspend rider');
        }
    }

    async activateRider(riderId: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/riders/${riderId}/activate`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to activate rider');
        }
    }

    async blockRider(riderId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/riders/${riderId}/block`, {
                reason
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to block rider');
        }
    }

    async getAvailableCompanies(): Promise<Array<{ id: string; name: string; status: string }>> {
        try {
            const response = await api.get<ApiResponse<{ data: Array<{ id: string; name: string; status: string }> }>>('/logistics/companies');
            return response.data.data.data || []; // Handle nested data structure
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch companies');
        }
    }
}

export const ridersService = new RidersService();
