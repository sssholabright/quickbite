export interface PaymentFilters {
    search?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    gateway?: 'PAYSTACK' | 'FLUTTERWAVE' | 'STRIPE' | 'SQUARE';
    paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH';
    dateRange?: {
        start: string;
        end: string;
    };
    amountRange?: {
        min: number;
        max: number;
    };
}

export interface PaymentSort {
    field: 'amount' | 'status' | 'createdAt' | 'completedAt' | 'customerEmail';
    direction: 'asc' | 'desc';
}

export interface PaymentListItem {
    id: string;
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    transactionId?: string;
    gatewayReference?: string;
    amount: number;
    currency: string;
    gateway: string;
    paymentMethod: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    gatewayResponse?: any;
    description?: string;
    initiatedAt: string;
    completedAt?: string;
    failedAt?: string;
    retryCount: number;
    maxRetries: number;
    refunds?: {
        id: string;
        amount: number;
        status: string;
        reason: string;
        createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface PaymentDetails extends PaymentListItem {
    order: {
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        vendor: {
            id: string;
            businessName: string;
        };
    };
    customer: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    refunds: {
        id: string;
        amount: number;
        reason: string;
        status: string;
        initiatedBy: string;
        initiatedAt: string;
        completedAt?: string;
        createdAt: string;
    }[];
}

export interface RefundRequest {
    amount?: number;
    reason: string;
}

export interface RetryPaymentRequest {
    paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH';
    customerEmail?: string;
    customerPhone?: string;
}

export interface PaymentsListResponse {
    data: PaymentListItem[];
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
        refundedAmount: number;
        totalTransactions: number;
        successRate: number;
    };
}

export interface ActionResponse {
    success: boolean;
    message: string;
    data?: any;
}
