import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/logisticsService';
import { 
    LogisticsCompaniesListParams,
    CreateLogisticsCompanyRequest,
    UpdateLogisticsCompanyRequest
} from '../types/logistics';

// Query keys
export const logisticsKeys = {
    all: ['logistics'] as const,
    companies: () => [...logisticsKeys.all, 'companies'] as const,
    companiesList: (params: LogisticsCompaniesListParams) => [...logisticsKeys.companies(), 'list', params] as const,
    companyDetails: (id: string) => [...logisticsKeys.companies(), 'details', id] as const,
};

// Companies list hook
export function useLogisticsCompaniesList(params: LogisticsCompaniesListParams) {
    return useQuery({
        queryKey: logisticsKeys.companiesList(params),
        queryFn: () => logisticsService.getCompaniesList(params),
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
    });
}

// Company details hook
export function useLogisticsCompanyDetails(companyId: string, enabled = true) {
    return useQuery({
        queryKey: logisticsKeys.companyDetails(companyId),
        queryFn: () => logisticsService.getCompanyDetails(companyId),
        enabled: enabled && !!companyId,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

// Create company mutation
export function useCreateLogisticsCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (request: CreateLogisticsCompanyRequest) =>
            logisticsService.createCompany(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companies() });
        },
    });
}

// Update company mutation
export function useUpdateLogisticsCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ companyId, request }: { companyId: string; request: UpdateLogisticsCompanyRequest }) =>
            logisticsService.updateCompany(companyId, request),
        onSuccess: (_, { companyId }) => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companies() });
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companyDetails(companyId) });
        },
    });
}

// Suspend company mutation
export function useSuspendLogisticsCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ companyId, reason }: { companyId: string; reason?: string }) =>
            logisticsService.suspendCompany(companyId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companies() });
        },
    });
}

// Activate company mutation
export function useActivateLogisticsCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (companyId: string) =>
            logisticsService.activateCompany(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companies() });
        },
    });
}

// Block company mutation
export function useBlockLogisticsCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ companyId, reason }: { companyId: string; reason?: string }) =>
            logisticsService.blockCompany(companyId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.companies() });
        },
    });
}

export function useUpdateCompany() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ companyId, request }: { companyId: string; request: any }) => 
            logisticsService.updateCompany(companyId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
        }
    });
}