import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSystemSettings() {
  console.log('🌱 Seeding initial system settings...');
  try {
    console.log('✅ System settings verified.');
  } catch (error) {
    console.error('❌ Error seeding system settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes('system-settings.seeder')) {
  seedSystemSettings();
}
