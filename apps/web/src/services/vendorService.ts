import { ApiResponse } from '../types/auth';
import { VendorProfile } from '../types/vendor';
import api from './api';

export interface VendorProfileData {
    name?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    businessAddress?: string;
    description?: string;
    logo?: string;
    latitude?: number;
    longitude?: number;
    isOpen?: boolean;
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
}

export interface VendorSettings {
    isOpen?: boolean;
    openingTime?: string;
    closingTime?: string;
    operatingDays?: string[];
}

export interface VendorStats {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    completionRate: number;
    cancellationRate: number;
    rating: number;
    avgPrepTime?: number;
    isOpen: boolean;
    daysActive: number;
}

class VendorService {
    // Get vendor profile
    async getProfile(): Promise<VendorProfile> {
        try {
            const response = await api.get<ApiResponse<any>>('/vendors/profile');
            const vendorData = response.data.data;
            
            // Transform backend data to frontend format
            return this.transformVendorData(vendorData);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get vendor profile');
        }
    }

    // Update vendor profile
    async updateProfile(data: VendorProfileData, logoFile?: File): Promise<VendorProfile> {
        try {
            // First update user profile (name, email, phone) via auth endpoint
            if (data.name || data.email || data.phone) {
                const userUpdateData: any = {};
                if (data.name) userUpdateData.name = data.name;
                if (data.email) userUpdateData.email = data.email;
                if (data.phone) userUpdateData.phone = data.phone;

                await api.put('/auth/profile', userUpdateData);
            }

            // Then update vendor-specific fields via vendor endpoint
            const formData = new FormData();
            
            // Add vendor-specific fields only
            if (data.businessName) formData.append('businessName', data.businessName);
            if (data.businessAddress) formData.append('businessAddress', data.businessAddress);
            if (data.description) formData.append('description', data.description);
            if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
            if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
            if (data.isOpen !== undefined) formData.append('isOpen', data.isOpen.toString());
            if (data.openingTime) formData.append('openingTime', data.openingTime);
            if (data.closingTime) formData.append('closingTime', data.closingTime);
            if (data.operatingDays) {
                data.operatingDays.forEach(day => formData.append('operatingDays', day));
            }
            
            // Add logo file if provided
            if (logoFile) {
                formData.append('image', logoFile);
            } else if (data.logo) {
                formData.append('logo', data.logo);
            }

            const response = await api.put<ApiResponse<any>>('/vendors/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return this.transformVendorData(response.data.data);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update vendor profile');
        }
    }

    // Update vendor settings
    async updateSettings(settings: VendorSettings): Promise<VendorProfile> {
        try {
            const response = await api.put<ApiResponse<any>>('/vendors/settings', settings);
            return this.transformVendorData(response.data.data);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update vendor settings');
        }
    }

    // Get vendor statistics
    async getStats(): Promise<VendorStats> {
        try {
            const response = await api.get<ApiResponse<VendorStats>>('/vendors/stats');
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get vendor statistics');
        }
    }

    // Transform backend vendor data to frontend format
    private transformVendorData(vendorData: any): VendorProfile {
        return {
            id: vendorData.id,
            name: vendorData.businessName,
            email: vendorData.user.email,
            phone: vendorData.user.phone || '',
            logo: vendorData.logo || vendorData.user.avatar,
            description: vendorData.description || '',
            address: {
                street: vendorData.businessAddress || '',
                city: 'Lagos', // You might want to parse this from businessAddress
                state: 'Lagos',
                country: 'Nigeria',
                postalCode: '',
                coordinates: {
                    lat: vendorData.latitude || 0,
                    lng: vendorData.longitude || 0
                }
            },
            bankDetails: {
                bankName: '',
                accountNumber: '',
                accountName: '',
                bankCode: '',
                isVerified: false
            },
            settings: {
                notifications: {
                    email: true,
                    sms: true,
                    push: true,
                    orderUpdates: true,
                    paymentUpdates: true,
                    marketing: false
                },
                business: {
                    isOpen: vendorData.isOpen,
                    operatingHours: {
                        monday: { open: '08:00', close: '22:00', isOpen: true },
                        tuesday: { open: '08:00', close: '22:00', isOpen: true },
                        wednesday: { open: '08:00', close: '22:00', isOpen: true },
                        thursday: { open: '08:00', close: '22:00', isOpen: true },
                        friday: { open: '08:00', close: '23:00', isOpen: true },
                        saturday: { open: '09:00', close: '23:00', isOpen: true },
                        sunday: { open: '10:00', close: '21:00', isOpen: true }
                    },
                    deliveryRadius: 10,
                    minimumOrderAmount: 1000
                }
            },
            createdAt: vendorData.createdAt,
            updatedAt: vendorData.updatedAt
        };
    }
}

export const vendorService = new VendorService();
