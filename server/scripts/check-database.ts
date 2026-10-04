import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Database connected successfully:', result);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
