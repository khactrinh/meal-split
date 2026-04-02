import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient | undefined;
};

const getPrisma = () => {
  if (globalForPrisma.prismaClient) return globalForPrisma.prismaClient;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClient = prisma;
