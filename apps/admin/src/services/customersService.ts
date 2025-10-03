import api from "./api";
import { CustomerFilters, CustomerSort, CustomersListResponse, CustomerDetails, UpdateCustomerRequest, ActionResponse } from "../types/customers";

export const customersService = {
    // Get customers list
    async getCustomersList(page: number, limit: number, filters: CustomerFilters, sort: CustomerSort): Promise<CustomersListResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                'sort[field]': sort.field,
                'sort[direction]': sort.direction
            });

            if (filters.search) params.append('filters[search]', filters.search);
            if (filters.status) params.append('filters[status]', filters.status);
            if (filters.dateRange) {
                params.append('filters[dateRange][start]', filters.dateRange.start);
                params.append('filters[dateRange][end]', filters.dateRange.end);
            }

            const response = await api.get(`/customers?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get customer details
    async getCustomerDetails(customerId: string): Promise<CustomerDetails> {
        try {
            const response = await api.get(`/customers/${customerId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update customer
    async updateCustomer(customerId: string, request: UpdateCustomerRequest): Promise<ActionResponse> {
        try {
            const response = await api.put(`/customers/${customerId}`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Suspend customer
    async suspendCustomer(customerId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/customers/${customerId}/suspend`, { reason });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Block customer
    async blockCustomer(customerId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/customers/${customerId}/block`, { reason });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Activate customer
    async activateCustomer(customerId: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/customers/${customerId}/activate`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get customer order history
    async getCustomerOrderHistory(customerId: string, page: number = 1, limit: number = 20) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            const response = await api.get(`/customers/${customerId}/orders?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};