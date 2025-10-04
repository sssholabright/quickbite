import { PrismaClient } from '@prisma/client';
import { PayoutsListParams, PayoutsListResponse, PayoutDetails, CreatePayoutRequest, UpdatePayoutRequest, WalletsListParams, WalletsListResponse, ActionResponse, PayoutListItem } from '../../../types/admin/payouts.js';
import { CustomError } from '../../../middlewares/errorHandler.js';

const prisma = new PrismaClient();

export class PayoutsService {
    // Get payouts list with filters and pagination
    async getPayoutsList(params: PayoutsListParams): Promise<PayoutsListResponse> {
        const { page, limit, filters, sort } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters.search) {
            where.OR = [
                { id: { contains: filters.search, mode: 'insensitive' } },
                { gatewayReference: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.recipientType) {
            where.recipientType = filters.recipientType;
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
        const total = await prisma.payout.count({ where });

        // Get payouts with recipient details
        const payouts = await prisma.payout.findMany({
            where,
            orderBy: {
                [sort.field === 'recipientName' ? 'createdAt' : sort.field]: sort.direction
            },
            skip,
            take: limit
        });

        // Get recipient details for each payout
        const data = await Promise.all(payouts.map(async (payout: any) => {
            let recipientName = '';
            let recipientEmail = '';
            let recipientPhone = '';

            if (payout.recipientType === 'VENDOR') {
                const vendor = await prisma.vendor.findUnique({
                    where: { id: payout.recipientId },
                    include: { user: true }
                });
                recipientName = vendor?.user.name || 'Unknown Vendor';
                recipientEmail = vendor?.user.email || '';
                recipientPhone = vendor?.user.phone || '';
            } else if (payout.recipientType === 'RIDER') {
                const rider = await prisma.rider.findUnique({
                    where: { id: payout.recipientId },
                    include: { user: true }
                });
                recipientName = rider?.user.name || 'Unknown Rider';
                recipientEmail = rider?.user.email || '';
                recipientPhone = rider?.user.phone || '';
            }

            return {
                id: payout.id,
                recipientType: payout.recipientType,
                recipientId: payout.recipientId,
                recipientName,
                recipientEmail,
                recipientPhone,
                amount: payout.amount,
                currency: payout.currency,
                status: payout.status as any,
                gatewayReference: payout.gatewayReference || undefined,
                gatewayResponse: payout.gatewayResponse,
                bankDetails: payout.bankDetails as any,
                initiatedBy: payout.initiatedBy,
                processedBy: payout.processedBy || undefined,
                approvedBy: payout.approvedBy || undefined,
                initiatedAt: payout.initiatedAt.toISOString(),
                processedAt: payout.processedAt?.toISOString(),
                completedAt: payout.completedAt?.toISOString(),
                failedAt: payout.failedAt?.toISOString(),
                failureReason: payout.failureReason || undefined,
                retryCount: payout.retryCount,
                maxRetries: payout.maxRetries,
                description: payout.description || undefined,
                notes: payout.notes || undefined,
                createdAt: payout.createdAt.toISOString(),
                updatedAt: payout.updatedAt.toISOString()
            };
        }));

        // Calculate summary
        const summaryData = await prisma.payout.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true }
        });

        const statusSummary = await prisma.payout.groupBy({
            by: ['status'],
            where,
            _sum: { amount: true },
            _count: { id: true }
        });

        const summary = {
            totalAmount: summaryData._sum.amount || 0,
            totalPayouts: summaryData._count.id || 0,
            successfulAmount: statusSummary.find((s: any) => s.status === 'SUCCESS')?._sum.amount || 0,
            failedAmount: statusSummary.find((s: any) => s.status === 'FAILED')?._sum.amount || 0,
            pendingAmount: statusSummary.find((s: any) => s.status === 'PENDING')?._sum.amount || 0,
            successRate: summaryData._count.id > 0 
                ? ((statusSummary.find((s: any) => s.status === 'SUCCESS')?._count.id || 0) / summaryData._count.id) * 100 
                : 0
        };

        return {
            data: data as PayoutListItem[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary
        };
    }

    // Get wallets list (vendors and riders with their balances)
    async getWalletsList(params: WalletsListParams): Promise<WalletsListResponse> {
        const { page, limit, recipientType, filters, sort } = params;
        const skip = (page - 1) * limit;

        let vendorWallets: any[] = [];
        let riderWallets: any[] = [];
        let totalVendors = 0;
        let totalRiders = 0;

        // Get vendor wallets
        if (!recipientType || recipientType === 'VENDOR') {
            const vendorWhere: any = {};
            
            if (filters.search) {
                vendorWhere.vendor = {
                    user: {
                        name: { contains: filters.search, mode: 'insensitive' }
                    }
                };
            }

            if (filters.isActive !== undefined) {
                vendorWhere.isActive = filters.isActive;
            }

            if (filters.hasBalance) {
                vendorWhere.currentBalance = { gt: 0 };
            }

            if (filters.canPayout) {
                vendorWhere.currentBalance = { gte: prisma.vendorWallet.fields.minimumPayout };
            }

            totalVendors = await prisma.vendorWallet.count({ where: vendorWhere });

            const vendors = await prisma.vendorWallet.findMany({
                where: vendorWhere,
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    [sort.field === 'recipientName' ? 'vendor' : sort.field]: 
                        sort.field === 'recipientName' ? { user: { name: sort.direction } } : sort.direction
                },
                skip: recipientType === 'VENDOR' ? skip : 0,
                ...(recipientType === 'VENDOR' && { take: limit })
            });

            vendorWallets = vendors.map((wallet: any) => ({
                id: wallet.id,
                recipientType: 'VENDOR' as const,
                recipientId: wallet.vendorId,
                recipientName: wallet.vendor.user.name,
                recipientEmail: wallet.vendor.user.email,
                recipientPhone: wallet.vendor.user.phone,
                currentBalance: wallet.currentBalance,
                pendingBalance: wallet.pendingBalance,
                totalEarnings: wallet.totalEarnings,
                totalPaidOut: wallet.totalPaidOut,
                totalCommission: wallet.totalCommission,
                commissionRate: wallet.commissionRate,
                payoutMethod: wallet.payoutMethod,
                payoutFrequency: wallet.payoutFrequency,
                minimumPayout: wallet.minimumPayout,
                isActive: wallet.isActive,
                lastPayoutDate: wallet.lastPayoutDate?.toISOString(),
                nextPayoutDate: wallet.nextPayoutDate?.toISOString(),
                canPayout: wallet.currentBalance >= wallet.minimumPayout && wallet.isActive,
                createdAt: wallet.createdAt.toISOString(),
                updatedAt: wallet.updatedAt.toISOString()
            }));
        }

        // Get rider wallets
        if (!recipientType || recipientType === 'RIDER') {
            const riderWhere: any = {};
            
            if (filters.search) {
                riderWhere.rider = {
                    user: {
                        name: { contains: filters.search, mode: 'insensitive' }
                    }
                };
            }

            if (filters.isActive !== undefined) {
                riderWhere.isActive = filters.isActive;
            }

            if (filters.hasBalance) {
                riderWhere.currentBalance = { gt: 0 };
            }

            if (filters.canPayout) {
                riderWhere.currentBalance = { gte: prisma.riderWallet.fields.minimumPayout };
            }

            totalRiders = await prisma.riderWallet.count({ where: riderWhere });

            const riders = await prisma.riderWallet.findMany({
                where: riderWhere,
                include: {
                    rider: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    [sort.field === 'recipientName' ? 'rider' : sort.field]: 
                        sort.field === 'recipientName' ? { user: { name: sort.direction } } : sort.direction
                },
                skip: recipientType === 'RIDER' ? skip : 0,
                ...(recipientType === 'RIDER' && { take: limit })
            });

            riderWallets = riders.map((wallet: any) => ({
                id: wallet.id,
                recipientType: 'RIDER' as const,
                recipientId: wallet.riderId,
                recipientName: wallet.rider.user.name,
                recipientEmail: wallet.rider.user.email,
                recipientPhone: wallet.rider.user.phone,
                currentBalance: wallet.currentBalance,
                pendingBalance: wallet.pendingBalance,
                totalEarnings: wallet.totalEarnings,
                totalPaidOut: wallet.totalPaidOut,
                totalCommission: wallet.totalCommission,
                commissionRate: wallet.commissionRate,
                payoutMethod: wallet.payoutMethod,
                payoutFrequency: wallet.payoutFrequency,
                minimumPayout: wallet.minimumPayout,
                isActive: wallet.isActive,
                lastPayoutDate: wallet.lastPayoutDate?.toISOString(),
                nextPayoutDate: wallet.nextPayoutDate?.toISOString(),
                canPayout: wallet.currentBalance >= wallet.minimumPayout && wallet.isActive,
                createdAt: wallet.createdAt.toISOString(),
                updatedAt: wallet.updatedAt.toISOString()
            }));
        }

        // Combine and sort data
        const allWallets = [...vendorWallets, ...riderWallets];
        
        // Apply pagination if no specific recipient type
        const data = recipientType ? allWallets : allWallets.slice(skip, skip + limit);
        const total = totalVendors + totalRiders;

        // Calculate summary
        const totalPendingBalance = allWallets.reduce((sum, w) => sum + w.pendingBalance, 0);
        const totalCurrentBalance = allWallets.reduce((sum, w) => sum + w.currentBalance, 0);
        const eligibleForPayout = allWallets.filter(w => w.canPayout).length;

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary: {
                totalVendors,
                totalRiders,
                totalPendingBalance,
                totalCurrentBalance,
                eligibleForPayout
            }
        };
    }

    // Create payout
    async createPayout(request: CreatePayoutRequest, adminId: string): Promise<ActionResponse> {
        const { recipientType, recipientId, amount } = request;

        // Validate recipient exists
        let wallet;
        if (recipientType === 'VENDOR') {
            wallet = await prisma.vendorWallet.findUnique({
                where: { vendorId: recipientId },
                include: { vendor: { include: { user: true } } }
            });
        } else {
            wallet = await prisma.riderWallet.findUnique({
                where: { riderId: recipientId },
                include: { rider: { include: { user: true } } }
            });
        }

        if (!wallet) {
            throw new CustomError(`${recipientType} wallet not found`, 404);
        }

        if (!wallet.isActive) {
            throw new CustomError(`${recipientType} wallet is not active`, 400);
        }

        if (amount > wallet.currentBalance) {
            throw new CustomError('Insufficient balance', 400);
        }

        if (amount < wallet.minimumPayout) {
            throw new CustomError(`Minimum payout amount is ${wallet.minimumPayout}`, 400);
        }

        // Get bank details
        const bankDetails = wallet.bankDetails as any;
        if (!bankDetails) {
            throw new CustomError('Bank details not configured', 400);
        }

        // Create payout
        const payout = await prisma.payout.create({
            data: {
                recipientType: recipientType as any,
                recipientId,
                amount,
                currency: 'NGN',
                status: 'PENDING',
                bankDetails,
                initiatedBy: adminId,
                description: request.description || null,
                notes: request.notes || null
            }
        });

        // Update wallet balance
        if (recipientType === 'VENDOR') {
            await prisma.vendorWallet.update({
                where: { vendorId: recipientId },
                data: {
                    currentBalance: wallet.currentBalance - amount,
                    pendingBalance: wallet.pendingBalance + amount
                }
            });
        } else {
            await prisma.riderWallet.update({
                where: { riderId: recipientId },
                data: {
                    currentBalance: wallet.currentBalance - amount,
                    pendingBalance: wallet.pendingBalance + amount
                }
            });
        }

        // TODO: Integrate with payout gateway
        await this.simulateGatewayPayout(payout.id);

        return {
            success: true,
            message: 'Payout initiated successfully',
            data: { payoutId: payout.id }
        };
    }

    // Update payout status
    async updatePayout(payoutId: string, request: UpdatePayoutRequest, adminId: string): Promise<ActionResponse> {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId }
        });

        if (!payout) {
            throw new CustomError('Payout not found', 404);
        }

        const updatedPayout = await prisma.payout.update({
            where: { id: payoutId },
            data: {
                ...request,
                processedBy: adminId
            }
        });

        return {
            success: true,
            message: 'Payout updated successfully',
            data: updatedPayout
        };
    }

    // Get payout details
    async getPayoutDetails(payoutId: string): Promise<PayoutDetails> {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId }
        });

        if (!payout) {
            throw new CustomError('Payout not found', 404);
        }

        // Get recipient details
        let recipient;
        let wallet;

        if (payout.recipientType === 'VENDOR') {
            const vendorWallet = await prisma.vendorWallet.findUnique({
                where: { vendorId: payout.recipientId },
                include: {
                    vendor: {
                        include: { user: true }
                    }
                }
            });
            
            recipient = {
                id: vendorWallet?.vendor.id || '',
                name: vendorWallet?.vendor.user.name || '',
                email: vendorWallet?.vendor.user.email || '',
                phone: vendorWallet?.vendor.user.phone || '',
                businessName: vendorWallet?.vendor.businessName || ''
            };

            wallet = {
                id: vendorWallet?.id || '',
                currentBalance: vendorWallet?.currentBalance || 0,
                pendingBalance: vendorWallet?.pendingBalance || 0,
                totalEarnings: vendorWallet?.totalEarnings || 0,
                totalPaidOut: vendorWallet?.totalPaidOut || 0,
                commissionRate: vendorWallet?.commissionRate || 0,
                payoutMethod: vendorWallet?.payoutMethod || '',
                payoutFrequency: vendorWallet?.payoutFrequency || ''
            };
        } else {
            const riderWallet = await prisma.riderWallet.findUnique({
                where: { riderId: payout.recipientId },
                include: {
                    rider: {
                        include: { 
                            user: true,
                            company: true  // Add this if company relation exists
                        }
                    }
                }
            });

            recipient = {
                id: riderWallet?.rider.id || '',
                name: riderWallet?.rider.user.name || '',
                email: riderWallet?.rider.user.email || '',
                phone: riderWallet?.rider.user.phone || '',
                companyName: riderWallet?.rider.companyId ? 'Company' : ''
            };

            wallet = {
                id: riderWallet?.id || '',
                currentBalance: riderWallet?.currentBalance || 0,
                pendingBalance: riderWallet?.pendingBalance || 0,
                totalEarnings: riderWallet?.totalEarnings || 0,
                totalPaidOut: riderWallet?.totalPaidOut || 0,
                commissionRate: riderWallet?.commissionRate || 0,
                payoutMethod: riderWallet?.payoutMethod || '',
                payoutFrequency: riderWallet?.payoutFrequency || ''
            };
        }

        return {
            id: payout.id,
            recipientType: payout.recipientType,
            recipientId: payout.recipientId,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            recipientPhone: recipient.phone,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status as any,
            gatewayReference: payout.gatewayReference || undefined,
            gatewayResponse: payout.gatewayResponse,
            bankDetails: payout.bankDetails as any,
            initiatedBy: payout.initiatedBy,
            processedBy: payout.processedBy || undefined,
            approvedBy: payout.approvedBy || undefined,
            initiatedAt: payout.initiatedAt.toISOString(),
            processedAt: payout.processedAt?.toISOString(),
            completedAt: payout.completedAt?.toISOString(),
            failedAt: payout.failedAt?.toISOString(),
            failureReason: payout.failureReason || undefined,
            retryCount: payout.retryCount,
            maxRetries: payout.maxRetries,
            description: payout.description || undefined,
            notes: payout.notes || undefined,
            createdAt: payout.createdAt.toISOString(),
            updatedAt: payout.updatedAt.toISOString(),
            recipient,
            wallet
        } as PayoutDetails;
    }

    // Simulate gateway payout (replace with actual gateway integration)
    private async simulateGatewayPayout(payoutId: string): Promise<void> {
        setTimeout(async () => {
            // Simulate random success/failure
            const success = Math.random() > 0.2; // 80% success rate

            const payout = await prisma.payout.findUnique({
                where: { id: payoutId }
            });

            if (!payout) return;

            const status = success ? 'SUCCESS' : 'FAILED';

            await prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status,
                    processedAt: new Date(),
                    completedAt: success ? new Date() : null,
                    failedAt: success ? null : new Date(),
                    failureReason: success ? null : 'Simulated gateway failure',
                    gatewayResponse: { 
                        simulated: true, 
                        message: success ? 'Payout processed successfully' : 'Payout failed'
                    }
                }
            });

            // Update wallet if successful
            if (success) {
                if (payout.recipientType === 'VENDOR') {
                    await prisma.vendorWallet.update({
                        where: { vendorId: payout.recipientId },
                        data: {
                            pendingBalance: { decrement: payout.amount },
                            totalPaidOut: { increment: payout.amount },
                            lastPayoutDate: new Date()
                        }
                    });
                } else {
                    await prisma.riderWallet.update({
                        where: { riderId: payout.recipientId },
                        data: {
                            pendingBalance: { decrement: payout.amount },
                            totalPaidOut: { increment: payout.amount },
                            lastPayoutDate: new Date()
                        }
                    });
                }
            } else {
                // Return money to current balance if failed
                if (payout.recipientType === 'VENDOR') {
                    await prisma.vendorWallet.update({
                        where: { vendorId: payout.recipientId },
                        data: {
                            currentBalance: { increment: payout.amount },
                            pendingBalance: { decrement: payout.amount }
                        }
                    });
                } else {
                    await prisma.riderWallet.update({
                        where: { riderId: payout.recipientId },
                        data: {
                            currentBalance: { increment: payout.amount },
                            pendingBalance: { decrement: payout.amount }
                        }
                    });
                }
            }
        }, 5000); // Simulate 5 second processing time
    }
}

export const payoutsService = new PayoutsService();