import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

// Create Prisma client instance
export const prisma = new PrismaClient({
    log: env.NODE_ENV !== 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
        db: {
            url: env.DATABASE_URL,
        },
    },
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0)
});