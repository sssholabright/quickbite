import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '../services/vendorsService';
import { VendorFilters, VendorSort, CreateVendorRequest, UpdateVendorRequest, UpdateVendorLocationRequest } from '../types/vendors';

// Query keys
export const vendorsKeys = {
    all: ['vendors'] as const,
    lists: () => [...vendorsKeys.all, 'list'] as const,
    list: (page: number, limit: number, filters: VendorFilters, sort: VendorSort) => 
        [...vendorsKeys.lists(), page, limit, filters, sort] as const,
    details: () => [...vendorsKeys.all, 'detail'] as const,
    detail: (id: string) => [...vendorsKeys.details(), id] as const,
};

// Get vendors list
export const useVendorsList = (
    page: number,
    limit: number,
    filters: VendorFilters,
    sort: VendorSort
) => {
    return useQuery({
        queryKey: vendorsKeys.list(page, limit, filters, sort),
        queryFn: () => vendorsService.getVendorsList(page, limit, filters, sort),
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get vendor details
export const useVendorDetails = (vendorId: string) => {
    return useQuery({
        queryKey: vendorsKeys.detail(vendorId),
        queryFn: () => vendorsService.getVendorDetails(vendorId),
        enabled: !!vendorId,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Create vendor
export const useCreateVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (request: CreateVendorRequest) => vendorsService.createVendor(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
        },
    });
};

// Update vendor
export const useUpdateVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ vendorId, request }: { vendorId: string; request: UpdateVendorRequest }) => 
            vendorsService.updateVendor(vendorId, request),
        onSuccess: (_, { vendorId }) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Update vendor location
export const useUpdateVendorLocation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ vendorId, request }: { vendorId: string; request: UpdateVendorLocationRequest }) => 
            vendorsService.updateVendorLocation(vendorId, request),
        onSuccess: (_, { vendorId }) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Approve vendor
export const useApproveVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (vendorId: string) => vendorsService.approveVendor(vendorId),
        onSuccess: (_, vendorId) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Suspend vendor
export const useSuspendVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ vendorId, reason }: { vendorId: string; reason?: string }) => 
            vendorsService.suspendVendor(vendorId, reason),
        onSuccess: (_, { vendorId }) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Reject vendor
export const useRejectVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ vendorId, reason }: { vendorId: string; reason?: string }) => 
            vendorsService.rejectVendor(vendorId, reason),
        onSuccess: (_, { vendorId }) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Block vendor
export const useBlockVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ vendorId, reason }: { vendorId: string; reason?: string }) => 
            vendorsService.blockVendor(vendorId, reason),
        onSuccess: (_, { vendorId }) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Activate vendor
export const useActivateVendor = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (vendorId: string) => vendorsService.activateVendor(vendorId),
        onSuccess: (_, vendorId) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};

// Update vendor open status
export const useUpdateVendorOpenStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (vendorId: string) => vendorsService.updateVendorOpenStatus(vendorId),
        onSuccess: (_, vendorId) => {
            queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: vendorsKeys.detail(vendorId) });
        },
    });
};