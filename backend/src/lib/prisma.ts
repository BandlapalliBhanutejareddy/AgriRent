import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL;
let adjustedUrl = dbUrl;
if (adjustedUrl) {
  if (!adjustedUrl.includes('connect_timeout')) {
    adjustedUrl = `${adjustedUrl}${adjustedUrl.includes('?') ? '&' : '?'}connect_timeout=15`;
  }
  if (!adjustedUrl.includes('pool_timeout')) {
    adjustedUrl = `${adjustedUrl}${adjustedUrl.includes('?') ? '&' : '?'}pool_timeout=20`;
  }
  if (!adjustedUrl.includes('connection_limit')) {
    adjustedUrl = `${adjustedUrl}${adjustedUrl.includes('?') ? '&' : '?'}connection_limit=10`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: adjustedUrl ? { db: { url: adjustedUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
