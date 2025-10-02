import { logger } from '../../../utils/logger.js';
import { prisma } from '../../../config/db.js';
import { ActivityFeedItem, AdminDashboardStats, CustomerAnalytics, DashboardFilters, OrderAnalytics, RiderAnalytics, VendorAnalytics } from '../../../types/admin/dashboard.js';
import { CustomError } from '../../../middlewares/errorHandler.js';
import { OrderStatus } from '../../../types/order.js';


export class DashboardService {
    // Get dashboard stats
    static async getDashboardStats(filters?: DashboardFilters): Promise<AdminDashboardStats> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get date range from filters or use today (only for orders today)
            const startDate = filters?.dateRange?.start ? new Date(filters.dateRange.start) : today;
            const endDate = filters?.dateRange?.end ? new Date(filters.dateRange.end) : tomorrow;

            // Parallel queries for better performance
            const [
                ordersToday,
                totalRevenue,
                onlineRiders,
                activeVendors,
                orderStatusCounts,
                totalCustomers,
                totalOrders,
                deliveredOrdersTotal,
                readyForPickupOrdersTotal,
                cancelledOrdersTotal,
                pendingOrdersTotal  // Add this new query
            ] = await Promise.all([
                // Orders today (only this one should be filtered by date)
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate
                        }
                    }
                }),

                // Total revenue from all delivered orders (not just today)
                prisma.order.aggregate({
                    where: {
                        status: {
                            in: ['DELIVERED'] as OrderStatus[]
                        }
                    },
                    _sum: {
                        total: true
                    }
                }),

                // Online riders (total from DB)
                prisma.rider.count({
                    where: {
                        isOnline: true
                    }
                }),

                // Active vendors (total from DB)
                prisma.vendor.count({
                    where: {
                        isActive: true,
                        isOpen: true
                    }
                }),

                // Order status counts for today only (for pending orders today)
                prisma.order.groupBy({
                    by: ['status'],
                    where: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate
                        }
                    },
                    _count: {
                        status: true
                    }
                }),

                // Total customers (total from DB)
                prisma.customer.count(),

                // Total orders from entire DB
                prisma.order.count(),

                // Total delivered orders from entire DB
                prisma.order.count({
                    where: {
                        status: 'DELIVERED'
                    }
                }),

                // Total ready for pickup orders from entire DB
                prisma.order.count({
                    where: {
                        status: 'READY_FOR_PICKUP'
                    }
                }),

                // Total cancelled orders from entire DB
                prisma.order.count({
                    where: {
                        status: 'CANCELLED'
                    }
                }),

                // Total pending orders from entire DB
                prisma.order.count({
                    where: {
                        status: 'PENDING'
                    }
                })
            ]);

            // Calculate order status counts for today
            const pendingOrdersToday = orderStatusCounts.find(o => o.status === 'PENDING')?._count.status || 0;
            const deliveredOrdersToday = orderStatusCounts.find(o => o.status === 'DELIVERED')?._count.status || 0;
            const readyForPickupToday = orderStatusCounts.find(o => o.status === 'READY_FOR_PICKUP')?._count.status || 0;
            const cancelledOrdersToday = orderStatusCounts.find(o => o.status === 'CANCELLED')?._count.status || 0;

            // Calculate derived stats
            const revenue = totalRevenue._sum.total || 0;
            const totalCompletedOrders = deliveredOrdersTotal + readyForPickupOrdersTotal;
            const averageOrderValue = deliveredOrdersTotal > 0 ? revenue / deliveredOrdersTotal : 0;
            const completionRate = totalOrders > 0 ? (totalCompletedOrders / totalOrders) * 100 : 0;

            return {
                ordersToday,
                totalRevenue: revenue,
                onlineRiders,
                activeVendors,
                pendingOrders: pendingOrdersTotal, // Use total pending orders from DB
                completedOrders: deliveredOrdersTotal, // Only delivered orders
                readyForPickupOrders: readyForPickupOrdersTotal, // Separate count
                cancelledOrders: cancelledOrdersTotal,
                totalCustomers,
                averageOrderValue,
                completionRate,
                // Today's breakdown
                deliveredOrdersToday,
                readyForPickupToday,
                cancelledOrdersToday,
                pendingOrdersToday  // Add this for today's pending orders
            };
        } catch (error) {
            logger.error({ error }, 'Get dashboard stats error');
            throw new CustomError('Failed to get dashboard stats', 500);
        }
    }

    // Get activity feed
    static async getActivityFeed(limit = 20, offset = 0): Promise<ActivityFeedItem[]> {
        try {
            // Get recent orders
            const recentOrders = await prisma.order.findMany({
                take: limit,
                skip: offset,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    rider: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            // Convert orders to activity feed items
            const activityItems: ActivityFeedItem[] = recentOrders.map(order => {
                let message = '';
                let type: ActivityFeedItem['type'] = 'order';

                switch (order.status) {
                    case 'PENDING':
                        message = `New order #${order.orderNumber} from ${order.vendor.user.name}`;
                        break;
                    case 'CONFIRMED':
                        message = `${order.vendor.user.name} confirmed order #${order.orderNumber}`;
                        break;
                    case 'PREPARING':
                        message = `${order.vendor.user.name} is preparing order #${order.orderNumber}`;
                        break;
                    case 'READY_FOR_PICKUP':
                        message = `Order #${order.orderNumber} is ready for pickup`;
                        break;
                    case 'ASSIGNED':
                        message = `Order #${order.orderNumber} assigned to ${order.rider?.user.name || 'a rider'}`;
                        type = 'rider';
                        break;
                    case 'PICKED_UP':
                        message = `${order.rider?.user.name || 'A rider'} picked up order #${order.orderNumber}`;
                        type = 'rider';
                        break;
                    case 'OUT_FOR_DELIVERY':
                        message = `Order #${order.orderNumber} is out for delivery`;
                        type = 'rider';
                        break;
                    case 'DELIVERED':
                        message = `Order #${order.orderNumber} delivered successfully`;
                        break;
                    case 'CANCELLED':
                        message = `Order #${order.orderNumber} was cancelled`;
                        break;
                    default:
                        message = `Order #${order.orderNumber} status updated`;
                }

                return {
                    id: order.id,
                    type,
                    message,
                    timestamp: order.updatedAt.toISOString(),
                    metadata: {
                        orderId: order.id,
                        riderId: order.riderId || '',
                        vendorId: order.vendorId,
                        customerId: order.customerId,
                        amount: order.total || 0,
                        status: order.status
                    }
                };
            });

            return activityItems;
        } catch (error) {
            logger.error({ error }, 'Get activity feed error');
            throw new CustomError('Failed to get activity feed', 500);
        }
    }

    // Get order analytics
    static async getOrderAnalytics(filters?: DashboardFilters): Promise<OrderAnalytics> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const startDate = filters?.dateRange?.start ? new Date(filters.dateRange.start) : today;
            const endDate = filters?.dateRange?.end ? new Date(filters.dateRange.end) : tomorrow;

            const [
                totalOrders,
                totalRevenue,
                orderStatusCounts
            ] = await Promise.all([
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate
                        }
                    }
                }),
                prisma.order.aggregate({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate
                        },
                        status: {
                            in: ['DELIVERED'] as OrderStatus[]
                        }
                    },
                    _sum: {
                        total: true
                    }
                }),
                prisma.order.groupBy({
                    by: ['status'],
                    where: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate
                        }
                    },
                    _count: {
                        status: true
                    }
                })
            ]);

            const completedOrders = orderStatusCounts.find(o => o.status === 'DELIVERED')?._count.status || 0;
            const cancelledOrders = orderStatusCounts.find(o => o.status === 'CANCELLED')?._count.status || 0;
            const pendingOrders = orderStatusCounts.find(o => o.status === 'PENDING')?._count.status || 0;

            const revenue = totalRevenue._sum.total || 0;
            const averageOrderValue = completedOrders > 0 ? revenue / completedOrders : 0;
            const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

            const ordersByStatus = orderStatusCounts.map(item => ({
                status: item.status,
                count: item._count.status,
                percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
            }));

            return {
                totalOrders,
                completedOrders,
                cancelledOrders,
                pendingOrders,
                totalRevenue: revenue,
                averageOrderValue,
                completionRate,
                ordersByStatus
            };
        } catch (error) {
            logger.error({ error }, 'Get order analytics error');
            throw new CustomError('Failed to get order analytics', 500);
        }
    }

    // Get rider analytics
    static async getRiderAnalytics(): Promise<RiderAnalytics> {
        try {
            const [
                totalRiders,
                onlineRiders,
                availableRiders,
                busyRiders,
                riderStats
            ] = await Promise.all([
                prisma.rider.count(),
                prisma.rider.count({
                    where: { isOnline: true }
                }),
                prisma.rider.count({
                    where: { 
                        isOnline: true,
                        isAvailable: true
                    }
                }),
                prisma.rider.count({
                    where: { 
                        isOnline: true,
                        isAvailable: false
                    }
                }),
                prisma.rider.aggregate({
                    _avg: {
                        rating: true,
                        completedOrders: true
                    }
                })
            ]);

            return {
                totalRiders,
                onlineRiders,
                availableRiders,
                busyRiders,
                averageRating: riderStats._avg.rating || 0,
                totalDeliveries: riderStats._avg.completedOrders || 0,
                averageDeliveryTime: 25 // Mock data - would need to calculate from actual delivery times
            };
        } catch (error) {
            logger.error({ error }, 'Get rider analytics error');
            throw new CustomError('Failed to get rider analytics', 500);
        }
    }

    // Get vendor analytics
    static async getVendorAnalytics(): Promise<VendorAnalytics> {
        try {
            const [
                totalVendors,
                activeVendors,
                inactiveVendors,
                vendorStats
            ] = await Promise.all([
                prisma.vendor.count(),
                prisma.vendor.count({
                    where: { 
                        isActive: true,
                        isOpen: true
                    }
                }),
                prisma.vendor.count({
                    where: { 
                        isActive: false
                    }
                }),
                prisma.vendor.aggregate({
                    _avg: {
                        rating: true
                    }
                })
            ]);

            // Get total orders for all vendors
            const totalOrders = await prisma.order.count({
                where: {
                    vendor: {
                        isActive: true
                    }
                }
            });

            return {
                totalVendors,
                activeVendors,
                inactiveVendors,
                averageRating: vendorStats._avg.rating || 0,
                totalOrders,
                averagePrepTime: 15 // Mock data - would need to calculate from actual prep times
            };
        } catch (error) {
            logger.error({ error }, 'Get vendor analytics error');
            throw new CustomError('Failed to get vendor analytics', 500);
        }
    }

    // Get customer analytics
    static async getCustomerAnalytics(): Promise<CustomerAnalytics> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [
                totalCustomers,
                newCustomersToday,
                customerStats
            ] = await Promise.all([
                prisma.customer.count(),
                prisma.customer.count({
                    where: {
                        createdAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                prisma.order.aggregate({
                    _avg: {
                        total: true
                    },
                    _count: {
                        id: true
                    }
                })
            ]);

            return {
                totalCustomers,
                activeCustomers: totalCustomers, // Mock - would need to define "active"
                newCustomersToday,
                averageOrderValue: customerStats._avg.total || 0,
                totalOrders: customerStats._count.id || 0
            };
        } catch (error) {
            logger.error({ error }, 'Get customer analytics error');
            throw new CustomError('Failed to get customer analytics', 500);
        }
    }
}