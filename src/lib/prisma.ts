import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Force env var for Prisma Client to find
process.env.DATABASE_URL = "file:d:/SDG/sdg-registration/prisma/dev.db";

let prismaInstance: PrismaClient;

try {
  prismaInstance = globalForPrisma.prisma || new PrismaClient();
} catch (e) {
    console.warn("Failed to initialize Prisma Client, using mock", e);
    // @ts-ignore
    prismaInstance = {
        user: {
            create: async () => ({ id: 0, name: 'Mock', college: 'Mock', email: 'mock@example.com', mobile: '000', photoPath: '/mock.jpg', createdAt: new Date() }),
            findMany: async () => [],
        } 
    } as unknown as PrismaClient
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
