import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../services/customersService';
import { CustomerFilters, CustomerSort, UpdateCustomerRequest } from '../types/customers';

// Query keys
export const customersKeys = {
    all: ['customers'] as const,
    lists: () => [...customersKeys.all, 'list'] as const,
    list: (page: number, limit: number, filters: CustomerFilters, sort: CustomerSort) => 
        [...customersKeys.lists(), page, limit, filters, sort] as const,
    details: () => [...customersKeys.all, 'detail'] as const,
    detail: (id: string) => [...customersKeys.details(), id] as const,
    orders: () => [...customersKeys.all, 'orders'] as const,
    ordersList: (customerId: string, page: number, limit: number) => 
        [...customersKeys.orders(), customerId, page, limit] as const,
};

// Get customers list
export const useCustomersList = (
    page: number,
    limit: number,
    filters: CustomerFilters,
    sort: CustomerSort
) => {
    return useQuery({
        queryKey: customersKeys.list(page, limit, filters, sort),
        queryFn: () => customersService.getCustomersList(page, limit, filters, sort),
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get customer details
export const useCustomerDetails = (customerId: string) => {
    return useQuery({
        queryKey: customersKeys.detail(customerId),
        queryFn: () => customersService.getCustomerDetails(customerId),
        enabled: !!customerId,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get customer order history
export const useCustomerOrderHistory = (customerId: string, page: number = 1, limit: number = 20) => {
    return useQuery({
        queryKey: customersKeys.ordersList(customerId, page, limit),
        queryFn: () => customersService.getCustomerOrderHistory(customerId, page, limit),
        enabled: !!customerId,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Update customer
export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ customerId, request }: { customerId: string; request: UpdateCustomerRequest }) => 
            customersService.updateCustomer(customerId, request),
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
        },
    });
};

// Suspend customer
export const useSuspendCustomer = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ customerId, reason }: { customerId: string; reason?: string }) => 
            customersService.suspendCustomer(customerId, reason),
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
        },
    });
};

// Block customer
export const useBlockCustomer = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ customerId, reason }: { customerId: string; reason?: string }) => 
            customersService.blockCustomer(customerId, reason),
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
        },
    });
};

// Activate customer
export const useActivateCustomer = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (customerId: string) => customersService.activateCustomer(customerId),
        onSuccess: (_, customerId) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
        },
    });
};
