import api from "./api";
import { PayoutFilters, PayoutSort, PayoutsListResponse, WalletsListResponse, CreatePayoutRequest, ActionResponse } from "../types/payouts";

export const payoutsService = {
    // Get payouts list
    async getPayoutsList(page: number, limit: number, filters: PayoutFilters, sort: PayoutSort): Promise<PayoutsListResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                'sort[field]': sort.field,
                'sort[direction]': sort.direction
            });

            if (filters.search) params.append('filters[search]', filters.search);
            if (filters.status) params.append('filters[status]', filters.status);
            if (filters.recipientType) params.append('filters[recipientType]', filters.recipientType);
            if (filters.dateRange) {
                params.append('filters[dateRange][start]', filters.dateRange.start);
                params.append('filters[dateRange][end]', filters.dateRange.end);
            }
            if (filters.amountRange) {
                params.append('filters[amountRange][min]', filters.amountRange.min.toString());
                params.append('filters[amountRange][max]', filters.amountRange.max.toString());
            }

            const response = await api.get(`/payouts?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get wallets list
    async getWalletsList(page: number, limit: number, recipientType?: 'VENDOR' | 'RIDER', filters?: any, sort?: any): Promise<WalletsListResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                'sort[field]': sort?.field || 'currentBalance',
                'sort[direction]': sort?.direction || 'desc'
            });

            if (recipientType) params.append('recipientType', recipientType);
            if (filters?.search) params.append('filters[search]', filters.search);
            if (filters?.hasBalance) params.append('filters[hasBalance]', 'true');
            if (filters?.canPayout) params.append('filters[canPayout]', 'true');
            if (filters?.isActive !== undefined) params.append('filters[isActive]', filters.isActive.toString());

            const response = await api.get(`/payouts/wallets?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create payout
    async createPayout(request: CreatePayoutRequest): Promise<ActionResponse> {
        try {
            const response = await api.post('/payouts', request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get payout details
    async getPayoutDetails(payoutId: string) {
        try {
            const response = await api.get(`/payouts/${payoutId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update payout
    async updatePayout(payoutId: string, request: any): Promise<ActionResponse> {
        try {
            const response = await api.put(`/payouts/${payoutId}`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};