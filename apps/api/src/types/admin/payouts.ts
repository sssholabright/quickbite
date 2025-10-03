export interface PayoutFilters {
    search?: string; // Search by recipient name, payout ID
    status?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED';
    recipientType?: 'VENDOR' | 'RIDER';
    dateRange?: {
        start: string; // YYYY-MM-DD format
        end: string;   // YYYY-MM-DD format
    };
    amountRange?: {
        min: number;
        max: number;
    };
}

export interface PayoutSort {
    field: 'amount' | 'status' | 'createdAt' | 'completedAt' | 'recipientName';
    direction: 'asc' | 'desc';
}

export interface PayoutListItem {
    id: string;
    recipientType: 'VENDOR' | 'RIDER';
    recipientId: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED';
    gatewayReference?: string;
    gatewayResponse?: any;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        bankCode: string;
    };
    initiatedBy: string;
    processedBy?: string;
    approvedBy?: string;
    initiatedAt: string;
    processedAt?: string;
    completedAt?: string;
    failedAt?: string;
    failureReason?: string;
    retryCount: number;
    maxRetries: number;
    description?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PayoutDetails extends PayoutListItem {
    recipient: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        businessName?: string; // For vendors
        companyName?: string; // For riders
    };
    wallet: {
        id: string;
        currentBalance: number;
        pendingBalance: number;
        totalEarnings: number;
        totalPaidOut: number;
        commissionRate: number;
        payoutMethod: string;
        payoutFrequency: string;
    };
}

export interface WalletListItem {
    id: string;
    recipientType: 'VENDOR' | 'RIDER';
    recipientId: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    currentBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    totalPaidOut: number;
    totalCommission: number;
    commissionRate: number;
    payoutMethod: string;
    payoutFrequency: string;
    minimumPayout: number;
    isActive: boolean;
    lastPayoutDate?: string;
    nextPayoutDate?: string;
    canPayout: boolean; // Whether they meet minimum payout threshold
    createdAt: string;
    updatedAt: string;
}

export interface CreatePayoutRequest {
    recipientType: 'VENDOR' | 'RIDER';
    recipientId: string;
    amount: number;
    description?: string;
    notes?: string;
}

export interface UpdatePayoutRequest {
    status?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED';
    notes?: string;
    approvedBy?: string;
}

export interface PayoutsListParams {
    page: number;
    limit: number;
    filters: PayoutFilters;
    sort: PayoutSort;
}

export interface WalletsListParams {
    page: number;
    limit: number;
    recipientType?: 'VENDOR' | 'RIDER';
    filters: {
        search?: string;
        hasBalance?: boolean;
        canPayout?: boolean;
        isActive?: boolean;
    };
    sort: {
        field: 'currentBalance' | 'pendingBalance' | 'totalEarnings' | 'lastPayoutDate' | 'recipientName';
        direction: 'asc' | 'desc';
    };
}

export interface PayoutsListResponse {
    data: PayoutListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        totalAmount: number;
        successfulAmount: number;
        failedAmount: number;
        pendingAmount: number;
        totalPayouts: number;
        successRate: number;
    };
}

export interface WalletsListResponse {
    data: WalletListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    summary: {
        totalVendors: number;
        totalRiders: number;
        totalPendingBalance: number;
        totalCurrentBalance: number;
        eligibleForPayout: number;
    };
}

export interface ActionResponse {
    success: boolean;
    message: string;
    data?: any;
}