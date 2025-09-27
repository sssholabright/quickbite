import { useOrders } from './useOrders';
import { OrderFilters } from '../types/order';

export const useEnhancedOrders = (filters?: OrderFilters) => {
    // 🚀 CORRECT: Just use React Query - it's the truth layer
    // Socket events will update the React Query cache directly
    return useOrders(filters);
};
