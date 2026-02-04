import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || (() => {
  const url = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db"
  const connection = new Database(url)
  const adapter = new PrismaBetterSqlite3(connection as any)
  return new PrismaClient({ adapter })
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
