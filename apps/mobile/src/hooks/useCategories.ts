import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface Category {
    id: string;
    name: string;
    description?: string;
    image?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get('/menu/categories/all');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
