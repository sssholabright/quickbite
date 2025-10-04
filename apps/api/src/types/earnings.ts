export interface EarningEntry {
    id: string;
    date: string; // ISO date
    orderId: string | null;
    amount: number;
    type: 'DELIVERY_FEE' | 'BONUS' | 'TIP' | 'PENALTY';
    description: string | null;
    status: 'pending' | 'paid';
}

export interface EarningsSummary {
    totalEarnings: number;
    totalCompleted: number;
    completedToday: number;
    earnedToday: number;
    rangeTotal: number;
    rangeCount: number;
}

export interface EarningsResponse {
    summary: EarningsSummary;
    earnings: EarningEntry[];
}

export type EarningsRange = 'day' | 'week' | 'month';