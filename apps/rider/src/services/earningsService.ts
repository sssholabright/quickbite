import { EarningsResponse, EarningsSummary, EarningsRange } from "../types/earnings";
import { ApiResponse } from "../types/auth";
import apiClient from "./api";

class EarningsService {
    // Get rider earnings with filtering
    static async getEarnings(range: EarningsRange = 'day'): Promise<EarningsResponse> {
        try {
            const response = await apiClient.get<ApiResponse<EarningsResponse>>(`/riders/earnings?range=${range}`);
            return response.data.data;
        } catch (error: any) {
            console.error("Error getting earnings: ", error);
            throw new Error(error.response?.data?.message || 'Failed to get earnings');
        }
    }

    // Get rider earnings summary only
    static async getEarningsSummary(): Promise<EarningsSummary> {
        try {
            const response = await apiClient.get<ApiResponse<EarningsSummary>>('/riders/earnings/summary');
            return response.data.data;
        } catch (error: any) {
            console.error("Error getting earnings summary: ", error);
            throw new Error(error.response?.data?.message || 'Failed to get earnings summary');
        }
    }
}

export default EarningsService;