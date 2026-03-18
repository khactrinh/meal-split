import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
