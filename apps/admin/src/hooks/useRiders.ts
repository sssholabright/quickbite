import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ridersService } from '../services/ridersService';
import { 
    RidersListParams,
    CreateRiderRequest,
    UpdateRiderRequest
} from '../types/logistics';

// Query keys
export const ridersKeys = {
    all: ['riders'] as const,
    list: (params: RidersListParams) => [...ridersKeys.all, 'list', params] as const,
    details: (id: string) => [...ridersKeys.all, 'details', id] as const,
    companies: () => [...ridersKeys.all, 'companies'] as const,
};

// Riders list hook
export function useRidersList(params: RidersListParams) {
    return useQuery({
        queryKey: ridersKeys.list(params),
        queryFn: () => ridersService.getRidersList(params),
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
    });
}

// Rider details hook
export function useRiderDetails(riderId: string, enabled = true) {
    return useQuery({
        queryKey: ridersKeys.details(riderId),
        queryFn: () => ridersService.getRiderDetails(riderId),
        enabled: enabled && !!riderId,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

// Available companies hook
export function useAvailableCompanies() {
    return useQuery({
        queryKey: ['available-companies'],
        queryFn: async () => {
            const companies = await ridersService.getAvailableCompanies();
            return Array.isArray(companies) ? companies : []; // Ensure it's always an array
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

// Create rider mutation
export function useCreateRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (request: CreateRiderRequest) =>
            ridersService.createRider(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ridersKeys.all });
        },
    });
}

// Update rider mutation
export function useUpdateRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ riderId, request }: { riderId: string; request: UpdateRiderRequest }) =>
            ridersService.updateRider(riderId, request),
        onSuccess: (_, { riderId }) => {
            queryClient.invalidateQueries({ queryKey: ridersKeys.all });
            queryClient.invalidateQueries({ queryKey: ridersKeys.details(riderId) });
        },
    });
}

// Suspend rider mutation
export function useSuspendRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ riderId, reason }: { riderId: string; reason?: string }) =>
            ridersService.suspendRider(riderId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ridersKeys.all });
        },
    });
}

// Activate rider mutation
export function useActivateRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (riderId: string) =>
            ridersService.activateRider(riderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ridersKeys.all });
        },
    });
}

// Block rider mutation
export function useBlockRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ riderId, reason }: { riderId: string; reason?: string }) =>
            ridersService.blockRider(riderId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ridersKeys.all });
        },
    });
}
