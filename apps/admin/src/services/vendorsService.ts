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

    // Create vendor with file upload support
    async createVendor(request: CreateVendorRequest, logoFile?: File): Promise<ActionResponse> {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', request.name);
            formData.append('email', request.email);
            formData.append('phone', request.phone);
            formData.append('password', request.password);
            formData.append('businessName', request.businessName);
            
            if (request.businessAddress) formData.append('businessAddress', request.businessAddress);
            if (request.latitude !== undefined) formData.append('latitude', request.latitude.toString());
            if (request.longitude !== undefined) formData.append('longitude', request.longitude.toString());
            if (request.description) formData.append('description', request.description);
            if (request.openingTime) formData.append('openingTime', request.openingTime);
            if (request.closingTime) formData.append('closingTime', request.closingTime);
            if (request.operatingDays) {
                request.operatingDays.forEach(day => formData.append('operatingDays', day));
            }
            
            // Add logo file if provided - use 'image' as field name to match backend middleware
            if (logoFile) {
                formData.append('image', logoFile);
            } else if (request.logo) {
                formData.append('logo', request.logo);
            }

            const response = await api.post('/vendors', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update vendor with file upload support
    async updateVendor(vendorId: string, request: UpdateVendorRequest, logoFile?: File): Promise<ActionResponse> {
        try {
            const formData = new FormData();
            
            // Add text fields
            if (request.name) formData.append('name', request.name);
            if (request.email) formData.append('email', request.email);
            if (request.phone) formData.append('phone', request.phone);
            if (request.businessName) formData.append('businessName', request.businessName);
            if (request.businessAddress) formData.append('businessAddress', request.businessAddress);
            
            // Convert numbers to strings for FormData
            if (request.latitude !== undefined) formData.append('latitude', request.latitude.toString());
            if (request.longitude !== undefined) formData.append('longitude', request.longitude.toString());
            
            if (request.description) formData.append('description', request.description);
            if (request.openingTime) formData.append('openingTime', request.openingTime);
            if (request.closingTime) formData.append('closingTime', request.closingTime);
            if (request.operatingDays) {
                request.operatingDays.forEach(day => formData.append('operatingDays', day));
            }
            if (request.status) formData.append('status', request.status);
            
            // Add logo file if provided
            if (logoFile) {
                formData.append('image', logoFile);
            } else if (request.logo) {
                formData.append('logo', request.logo);
            }

            console.log(formData);

            const response = await api.put(`/vendors/${vendorId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
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
