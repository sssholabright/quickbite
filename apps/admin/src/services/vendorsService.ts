import api from "./api";
import { CreateVendorRequest, UpdateVendorRequest, UpdateVendorLocationRequest, VendorDetails, VendorFilters, VendorsListResponse, VendorSort, ActionResponse } from "../types/vendors";

export const vendorsService = {
    // Get vendors list
    async getVendorsList(page: number, limit: number, filters: VendorFilters, sort: VendorSort): Promise<VendorsListResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                'sort[field]': sort.field,
                'sort[direction]': sort.direction
            });

            if (filters.search) params.append('filters[search]', filters.search);
            if (filters.status) params.append('filters[status]', filters.status);
            if (filters.isOpen !== undefined) params.append('filters[isOpen]', filters.isOpen.toString());

            const response = await api.get(`/vendors?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get vendor details
    async getVendorDetails(vendorId: string): Promise<VendorDetails> {
        try {
            const response = await api.get(`/vendors/${vendorId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create vendor
    async createVendor(request: CreateVendorRequest): Promise<ActionResponse> {
        try {
            const response = await api.post('/vendors', request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update vendor
    async updateVendor(vendorId: string, request: UpdateVendorRequest): Promise<ActionResponse> {
        try {
            const response = await api.put(`/vendors/${vendorId}`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update vendor location
    async updateVendorLocation(vendorId: string, request: UpdateVendorLocationRequest): Promise<ActionResponse> {
        try {
            const response = await api.patch(`/vendors/${vendorId}/location`, request);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Approve vendor
    async approveVendor(vendorId: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/approve`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Suspend vendor
    async suspendVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/suspend`, { reason });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Reject vendor
    async rejectVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/reject`, { reason });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Block vendor
    async blockVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/block`, { reason });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Activate vendor
    async activateVendor(vendorId: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/activate`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update vendor open status
    async updateVendorOpenStatus(vendorId: string): Promise<ActionResponse> {
        try {
            const response = await api.post(`/vendors/${vendorId}/update-status`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
