import api from "./api";
import { PaymentFilters, PaymentSort, PaymentsListResponse, PaymentDetails, RefundRequest, RetryPaymentRequest, ActionResponse } from "../types/payments";

export const paymentsService = {
    // Get payments list
    async getPaymentsList(page: number, limit: number, filters: PaymentFilters, sort: PaymentSort): Promise<PaymentsListResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                'sort[field]': sort.field,
                'sort[direction]': sort.direction
            });

            if (filters.search) params.append('filters[search]', filters.search);
            if (filters.status) params.append('filters[status]', filters.status);
            if (filters.gateway) params.append('filters[gateway]', filters.gateway);
            if (filters.paymentMethod) params.append('filters[paymentMethod]', filters.paymentMethod);
            if (filters.dateRange) {
                params.append('filters[dateRange][start]', filters.dateRange.start);
                params.append('filters[dateRange][end]', filters.dateRange.end);
            }
            if (filters.amountRange) {
                params.append('filters[amountRange][min]', filters.amountRange.min.toString());
                params.append('filters[amountRange][max]', filters.amountRange.max.toString());
            }

            const response = await api.get(`/payments?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get payment details
    async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
        try {
            const response = await api.get(`/payments/${paymentId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Process refund
    async processRefund(paymentId: string, request: RefundRequest): Promise<ActionResponse> {
        try {
            const response = await api.post(`/payments/${paymentId}/refund`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Retry payment
    async retryPayment(paymentId: string, request: RetryPaymentRequest): Promise<ActionResponse> {
        try {
            const response = await api.post(`/payments/${paymentId}/retry`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

