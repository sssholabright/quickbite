import { PrismaClient } from '@prisma/client';
import { PaymentsListParams, PaymentsListResponse, ActionResponse, PaymentDetails, RefundRequest, RetryPaymentRequest } from '../../../types/admin/payments.js';
import { CustomError } from '../../../middlewares/errorHandler.js';

const prisma = new PrismaClient();

export class PaymentsService {
    // Get payments list with filters, pagination, and summary
    async getPaymentsList(params: PaymentsListParams): Promise<PaymentsListResponse> {
        const { page, limit, filters, sort } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters.search) {
            where.OR = [
                { transactionId: { contains: filters.search, mode: 'insensitive' } },
                { gatewayReference: { contains: filters.search, mode: 'insensitive' } },
                { customerEmail: { contains: filters.search, mode: 'insensitive' } },
                { customerPhone: { contains: filters.search, mode: 'insensitive' } },
                { 
                    order: {
                        orderNumber: { contains: filters.search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.gateway) {
            where.gateway = filters.gateway;
        }

        if (filters.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }

        if (filters.dateRange) {
            where.createdAt = {
                gte: new Date(filters.dateRange.start),
                lte: new Date(filters.dateRange.end)
            };
        }

        if (filters.amountRange) {
            where.amount = {
                gte: filters.amountRange.min,
                lte: filters.amountRange.max
            };
        }

        // Get total count
        const total = await prisma.payment.count({ where });

        // Get payments with related data
        const payments = await prisma.payment.findMany({
            where,
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        status: true,
                        total: true,
                        vendor: {
                            select: {
                                id: true,
                                businessName: true
                            }
                        }
                    }
                },
                customer: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                refunds: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        reason: true,
                        initiatedBy: true,
                        initiatedAt: true,
                        completedAt: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                [sort.field === 'customerEmail' ? 'customerEmail' : sort.field]: sort.direction
            },
            skip,
            take: limit
        });

        // Transform data
        const data = payments.map((payment: any) => ({
            id: payment.id,
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            customerId: payment.customerId,
            customerName: payment.customer.user.name,
            customerEmail: payment.customerEmail,
            customerPhone: payment.customerPhone || undefined,
            transactionId: payment.transactionId || undefined,
            gatewayReference: payment.gatewayReference || undefined,
            amount: payment.amount,
            currency: payment.currency,
            gateway: payment.gateway,
            paymentMethod: payment.paymentMethod,
            status: payment.status as any,
            gatewayResponse: payment.gatewayResponse || undefined,
            description: payment.description || undefined,
            initiatedAt: payment.initiatedAt.toISOString(),
            completedAt: payment.completedAt?.toISOString(),
            failedAt: payment.failedAt?.toISOString(),
            retryCount: payment.retryCount,
            maxRetries: payment.maxRetries,
            refunds: payment.refunds.map((refund: any) => ({
                id: refund.id,
                amount: refund.amount,
                status: refund.status as any,
                reason: refund.reason,
                initiatedBy: refund.initiatedBy,
                initiatedAt: refund.initiatedAt.toISOString(),
                completedAt: refund.completedAt?.toISOString() || undefined,
                createdAt: refund.createdAt.toISOString()
            })),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString()
        }));

        // Calculate summary
        const summaryData = await prisma.payment.aggregate({
            where,
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        const statusSummary = await prisma.payment.groupBy({
            by: ['status'],
            where,
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        const summary = {
            totalAmount: summaryData._sum.amount || 0,
            totalTransactions: summaryData._count.id || 0,
            successfulAmount: statusSummary.find((s: any) => s.status === 'SUCCESS')?._sum.amount || 0,
            failedAmount: statusSummary.find((s: any) => s.status === 'FAILED')?._sum.amount || 0,
            pendingAmount: statusSummary.find((s: any) => s.status === 'PENDING')?._sum.amount || 0,
            refundedAmount: statusSummary.find((s: any) => s.status === 'REFUNDED')?._sum.amount || 0,
            successRate: summaryData._count.id > 0 
                ? ((statusSummary.find((s: any) => s.status === 'SUCCESS')?._count.id || 0) / summaryData._count.id) * 100 
                : 0
        };

        return {
            data: data as any,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary: summary as any
        };
    }

    // Get payment details
    async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        total: true,
                        vendor: {
                            select: {
                                id: true,
                                businessName: true
                            }
                        }
                    }
                },
                customer: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                refunds: {
                    select: {
                        id: true,
                        amount: true,
                        reason: true,
                        status: true,
                        initiatedBy: true,
                        initiatedAt: true,
                        completedAt: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!payment) {
            throw new CustomError('Payment not found', 404);
        }

        return {
            id: payment.id,
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            customerId: payment.customerId,
            customerName: payment.customer.user.name,
            customerEmail: payment.customerEmail,
            ...(payment.customerPhone && { customerPhone: payment.customerPhone }),
            ...(payment.transactionId && { transactionId: payment.transactionId }),
            ...(payment.gatewayReference && { gatewayReference: payment.gatewayReference }),
            amount: payment.amount,
            currency: payment.currency,
            gateway: payment.gateway,
            paymentMethod: payment.paymentMethod,
            status: payment.status as any,
            ...(payment.gatewayResponse && { gatewayResponse: payment.gatewayResponse }),
            ...(payment.description && { description: payment.description }),
            initiatedAt: payment.initiatedAt.toISOString(),
            ...(payment.completedAt && { completedAt: payment.completedAt.toISOString() }),
            ...(payment.failedAt && { failedAt: payment.failedAt.toISOString() }),
            retryCount: payment.retryCount,
            maxRetries: payment.maxRetries,
            refunds: payment.refunds.map((refund: any) => ({
                id: refund.id,
                amount: refund.amount,
                status: refund.status as any,
                reason: refund.reason,
                initiatedBy: refund.initiatedBy,
                initiatedAt: refund.initiatedAt.toISOString(),
                ...(refund.completedAt && { completedAt: refund.completedAt.toISOString() }),
                createdAt: refund.createdAt.toISOString()
            })),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            order: {
                id: payment.order.id,
                orderNumber: payment.order.orderNumber,
                status: payment.order.status,
                total: payment.order.total || 0,
                vendor: {
                    id: payment.order.vendor.id,
                    businessName: payment.order.vendor.businessName
                }
            },
            customer: {
                id: payment.customer.id,
                name: payment.customer.user.name,
                email: payment.customer.user.email,
                ...(payment.customer.user.phone && { phone: payment.customer.user.phone })
            }
        };
    }

    // Process refund
    async processRefund(paymentId: string, request: RefundRequest, adminId: string): Promise<ActionResponse> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { refunds: true }
        });

        if (!payment) {
            throw new CustomError('Payment not found', 404);
        }

        if (payment.status !== 'SUCCESS') {
            throw new CustomError('Only successful payments can be refunded', 400);
        }

        // Calculate refund amount
        const totalRefunded = payment.refunds
            .filter((r: any) => r.status === 'SUCCESS')
            .reduce((sum: any, r: any) => sum + r.amount, 0);

        const availableAmount = payment.amount - totalRefunded;

        if (availableAmount <= 0) {
            throw new CustomError('No amount available for refund', 400);
        }

        const refundAmount = request.amount || availableAmount;

        if (refundAmount > availableAmount) {
            throw new CustomError(`Maximum refund amount is ${availableAmount}`, 400);
        }

        // Create refund record
        const refund = await prisma.refund.create({
            data: {
                paymentId,
                amount: refundAmount,
                reason: request.reason,
                initiatedBy: adminId,
                status: 'PENDING'
            }
        });

        // TODO: Integrate with payment gateway for actual refund
        // For now, we'll simulate the refund process
        await this.simulateGatewayRefund(refund.id);

        return {
            success: true,
            message: 'Refund initiated successfully',
            data: { refundId: refund.id }
        };
    }

    // Retry failed payment
    async retryPayment(paymentId: string, request: RetryPaymentRequest, adminId: string): Promise<ActionResponse> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            throw new CustomError('Payment not found', 404);
        }

        if (payment.status !== 'FAILED') {
            throw new CustomError('Only failed payments can be retried', 400);
        }

        if (payment.retryCount >= payment.maxRetries) {
            throw new CustomError('Maximum retry attempts reached', 400);
        }

        // Update payment with retry attempt
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                retryCount: payment.retryCount + 1,
                status: 'PROCESSING',
                customerEmail: request.customerEmail || payment.customerEmail,
                customerPhone: request.customerPhone || payment.customerPhone,
                paymentMethod: request.paymentMethod || payment.paymentMethod,
                completedAt: null,
                failedAt: null
            }
        });

        // TODO: Integrate with payment gateway for actual retry
        // For now, we'll simulate the retry process
        await this.simulateGatewayRetry(paymentId);

        return {
            success: true,
            message: 'Payment retry initiated successfully'
        };
    }

    // Simulate gateway refund (replace with actual gateway integration)
    private async simulateGatewayRefund(refundId: string): Promise<void> {
        setTimeout(async () => {
            await prisma.refund.update({
                where: { id: refundId },
                data: {
                    status: 'SUCCESS',
                    processedAt: new Date(),
                    completedAt: new Date(),
                    gatewayResponse: { simulated: true, message: 'Refund processed successfully' }
                }
            });

            // Update payment status if fully refunded
            const refund = await prisma.refund.findUnique({
                where: { id: refundId },
                include: { payment: true }
            });

            if (refund) {
                const totalRefunded = await prisma.refund.aggregate({
                    where: {
                        paymentId: refund.paymentId,
                        status: 'SUCCESS'
                    },
                    _sum: { amount: true }
                });

                if (totalRefunded._sum.amount && totalRefunded._sum.amount >= refund.payment.amount) {
                    await prisma.payment.update({
                        where: { id: refund.paymentId },
                        data: { status: 'REFUNDED' }
                    });
                }
            }
        }, 2000); // Simulate 2 second processing time
    }

    // Simulate gateway retry (replace with actual gateway integration)
    private async simulateGatewayRetry(paymentId: string): Promise<void> {
        setTimeout(async () => {
            // Simulate random success/failure
            const success = Math.random() > 0.3; // 70% success rate

            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: success ? 'SUCCESS' : 'FAILED',
                    completedAt: success ? new Date() : null,
                    failedAt: success ? null : new Date(),
                    gatewayResponse: { 
                        simulated: true, 
                        message: success ? 'Payment processed successfully' : 'Payment failed'
                    }
                }
            });
        }, 3000); // Simulate 3 second processing time
    }
}

export const paymentsService = new PaymentsService();