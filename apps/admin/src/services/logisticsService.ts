import { 
    LogisticsCompany,
    LogisticsCompanyListItem,
    LogisticsCompaniesListParams,
    LogisticsCompaniesListResponse,
    CreateLogisticsCompanyRequest,
    UpdateLogisticsCompanyRequest,
    ActionResponse
} from '../types/logistics';
import api from './api';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

class LogisticsService {
    async getCompaniesList(params: LogisticsCompaniesListParams): Promise<LogisticsCompaniesListResponse> {
        try {
            const response = await api.get<ApiResponse<LogisticsCompaniesListResponse>>('/logistics/companies', {
                params
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch logistics companies');
        }
    }

    async getCompanyDetails(companyId: string): Promise<LogisticsCompany> {
        try {
            const response = await api.get<ApiResponse<LogisticsCompany>>(`/logistics/companies/${companyId}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch company details');
        }
    }

    async createCompany(request: CreateLogisticsCompanyRequest): Promise<LogisticsCompany> {
        try {
            const response = await api.post<ApiResponse<LogisticsCompany>>('/logistics/companies', request);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create logistics company');
        }
    }

    async updateCompany(companyId: string, request: UpdateLogisticsCompanyRequest): Promise<LogisticsCompany> {
        try {
            const response = await api.put<ApiResponse<LogisticsCompany>>(`/logistics/companies/${companyId}`, request);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update logistics company');
        }
    }

    async suspendCompany(companyId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/logistics/companies/${companyId}/suspend`, {
                reason
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to suspend company');
        }
    }

    async activateCompany(companyId: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/logistics/companies/${companyId}/activate`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to activate company');
        }
    }

    async blockCompany(companyId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post<ApiResponse<ActionResponse>>(`/logistics/companies/${companyId}/block`, {
                reason
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to block company');
        }
    }
}

export const logisticsService = new LogisticsService();