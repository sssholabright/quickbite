import { prisma } from "../../../config/db.js";
import { CustomError } from "../../../middlewares/errorHandler.js";
import { ActionResponse, CreateLogisticsCompanyRequest, LogisticsCompaniesListParams, LogisticsCompaniesListResponse, LogisticsCompany, LogisticsCompanyListItem, UpdateLogisticsCompanyRequest } from "../../../types/admin/logistics.js";
import { logger } from "../../../utils/logger.js";

export class LogisticsService {
    // Get list of logistics companies
    static async getCompaniesList(params: LogisticsCompaniesListParams): Promise<LogisticsCompaniesListResponse> {
        try {
            const {
                page = 1,
                limit = 20,
                filters = {},
                sort = { field: 'createdAt', direction: 'desc' }
            } = params;

            const skip = (page - 1) * limit;

            // Build where clause for filters
            const where: any = {};

            if (filters.status && filters.status.trim() !== '') {
                where.status = filters.status;
            }

            if (filters.search && filters.search.trim() !== '') {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { contactPerson: { contains: filters.search, mode: 'insensitive' } },
                    { phone: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            // Build orderBy clause
            const orderBy: any = {};
            orderBy[sort.field] = sort.direction;

            // Get companies with rider counts and earnings
            const [companies, total] = await Promise.all([
                prisma.logisticsCompany.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        riders: {
                            select: {
                                id: true,
                                isOnline: true,
                                earnings: true
                            }
                        }
                    }
                }),
                prisma.logisticsCompany.count({ where })
            ]);

            // Transform companies to match response format
            const companyList: LogisticsCompanyListItem[] = companies.map((company: any) => ({
                id: company.id,
                name: company.name,
                contactPerson: company.contactPerson,
                phone: company.phone,
                email: company.email,
                status: company.status,
                ridersCount: company.riders.length,
                onlineRidersCount: company.riders.filter((rider: any) => rider.isOnline).length,
                totalEarnings: company.riders.reduce((sum: any, rider: any) => sum + rider.earnings, 0),
                createdAt: company.createdAt.toISOString()
            }));

            const totalPages = Math.ceil(total / limit);

            return {
                data: companyList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } catch (error) {
            logger.error({ error }, 'Failed to get companies list');
            throw new CustomError('Failed to get companies list', 500);
        }
    }

    // Get single logistics company
    static async getCompanyDetails(companyId: string): Promise<LogisticsCompany> {
        try {
            const company = await prisma.logisticsCompany.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                throw new CustomError('Logistics company not found', 404);
            }

            return {
                id: company.id,
                name: company.name,
                contactPerson: company.contactPerson,
                phone: company.phone,
                email: company.email,
                address: company.address || '',
                status: company.status,
                createdAt: company.createdAt.toISOString(),
                updatedAt: company.updatedAt.toISOString()
            };
        } catch (error) {
            logger.error({ error, companyId }, 'Failed to get logistics company details');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get logistics company details', 500);
        }
    }

    // Create new logistics company
    static async createCompany(request: CreateLogisticsCompanyRequest): Promise<LogisticsCompany> {
        try {
            // Check if company name already exists
            const existingCompany = await prisma.logisticsCompany.findUnique({
                where: { name: request.name }
            });

            if (existingCompany) {
                throw new CustomError('Company name already exists', 400);
            }

            // Check if email already exists
            const existingEmail = await prisma.logisticsCompany.findFirst({
                where: { email: request.email }
            });

            if (existingEmail) {
                throw new CustomError('Email already exists', 400);
            }

            const company = await prisma.logisticsCompany.create({
                data: {
                    name: request.name,
                    contactPerson: request.contactPerson,   
                    phone: request.phone,
                    email: request.email,
                    address: request.address || null,
                    status: 'ACTIVE'
                }
            });

            return {
                id: company.id,
                name: company.name,
                contactPerson: company.contactPerson,
                phone: company.phone,
                email: company.email,
                address: company.address || '',
                status: company.status,
                createdAt: company.createdAt.toISOString(),
                updatedAt: company.updatedAt.toISOString()
            };
        } catch (error) {
            logger.error({ error, request }, 'Failed to create logistics company');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to create logistics company', 500);
        }
    }

    // Update logistics company
    static async updateCompany(companyId: string, request: UpdateLogisticsCompanyRequest): Promise<LogisticsCompany> {
        try {
            // Check if company exists
            const existingCompany = await prisma.logisticsCompany.findUnique({
                where: { id: companyId }
            });

            if (!existingCompany) {
                throw new CustomError('Logistics company not found', 404);
            }

            // Check if new name already exists (if name is being updated)
            if (request.name && request.name !== existingCompany.name) {
                const nameExists = await prisma.logisticsCompany.findUnique({
                    where: { name: request.name }
                });

                if (nameExists) {
                    throw new CustomError('Company name already exists', 400);
                }
            }

            // Check if new email already exists (if email is being updated)
            if (request.email && request.email !== existingCompany.email) {
                const emailExists = await prisma.logisticsCompany.findFirst({
                    where: { email: request.email }
                });

                if (emailExists) {
                    throw new CustomError('Email already exists', 400);
                }
            }

            const company = await prisma.logisticsCompany.update({
                where: { id: companyId },
                data: request
            });

            return {
                id: company.id,
                name: company.name,
                contactPerson: company.contactPerson,
                phone: company.phone,
                email: company.email,
                address: company.address || '',
                status: company.status,
                createdAt: company.createdAt.toISOString(),
                updatedAt: company.updatedAt.toISOString()
            };
        } catch (error) {
            logger.error({ error, companyId, request }, 'Failed to update logistics company');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update logistics company', 500);
        }
    }

    // Suspend logistics company
    static async suspendCompany(companyId: string, reason?: string): Promise<ActionResponse> {
        try {
            const company = await prisma.logisticsCompany.findUnique({
                where: { id: companyId },
                include: { riders: true }
            });

            if (!company) {
                throw new CustomError('Logistics company not found', 404);
            }

            if (company.status === 'SUSPENDED') {
                throw new CustomError('Company is already suspended', 400);
            }

            // Update company status
            await prisma.logisticsCompany.update({
                where: { id: companyId },
                data: { status: 'SUSPENDED' }
            });

            // Set all riders under this company as offline and unavailable
            await prisma.rider.updateMany({
                where: { companyId },
                data: { 
                    isOnline: false,
                    isAvailable: false,
                }
            });

            // Set all users under this rider to inactive
            await prisma.user.updateMany({
                where: { 
                    rider: {
                        companyId: companyId
                    }
                },
                data: { isActive: false }
            });

            logger.info({ companyId, reason }, 'Logistics company suspended');

            return {
                success: true,
                message: `Company "${company.name}" has been suspended. All ${company.riders.length} riders are now offline.`
            };
        } catch (error) {
            logger.error({ error, companyId }, 'Failed to suspend logistics company');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to suspend logistics company', 500);
        }
    }

    // Activate logistics company
    static async activateCompany(companyId: string): Promise<ActionResponse> {
        try {
            const company = await prisma.logisticsCompany.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                throw new CustomError('Logistics company not found', 404);
            }

            if (company.status === 'ACTIVE') {
                throw new CustomError('Company is already active', 400);
            }

            await prisma.logisticsCompany.update({
                where: { id: companyId },
                data: { status: 'ACTIVE' }
            });

            // Set all riders under this company as online and available
            await prisma.rider.updateMany({
                where: { companyId },
                data: { isOnline: true, isAvailable: true }
            });

            // Set all users under this rider to active
            await prisma.user.updateMany({
                where: { 
                    rider: {
                        companyId: companyId
                    }
                },
                data: { isActive: true }
            });

            logger.info({ companyId }, 'Logistics company activated');

            return {
                success: true,
                message: `Company "${company.name}" has been activated. Riders can now come online.`
            };
        } catch (error) {
            logger.error({ error, companyId }, 'Failed to activate logistics company');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to activate logistics company', 500);
        }
    }

     // Block logistics company
     static async blockCompany(companyId: string, reason?: string): Promise<ActionResponse> {
        try {
            const company = await prisma.logisticsCompany.findUnique({
                where: { id: companyId },
                include: { riders: true }
            });

            if (!company) {
                throw new CustomError('Logistics company not found', 404);
            }

            if (company.status === 'BLOCKED') {
                throw new CustomError('Company is already blocked', 400);
            }

            // Update company status
            await prisma.logisticsCompany.update({
                where: { id: companyId },
                data: { status: 'BLOCKED' }
            });

            // Set all riders under this company as offline and unavailable
            await prisma.rider.updateMany({
                where: { companyId },
                data: { 
                    isOnline: false,
                    isAvailable: false
                }
            });

            // Set all users under this rider to inactive
            await prisma.user.updateMany({
                where: { 
                    rider: {
                        companyId: companyId
                    }
                },
                data: { isActive: false }
            });

            logger.info({ companyId, reason }, 'Logistics company blocked');

            return {
                success: true,
                message: `Company "${company.name}" has been blocked. All ${company.riders.length} riders are now offline and cannot come online.`
            };
        } catch (error) {
            logger.error({ error, companyId }, 'Failed to block logistics company');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to block logistics company', 500);
        }
    }
}