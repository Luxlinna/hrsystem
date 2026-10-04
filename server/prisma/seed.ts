import { prisma } from '../config/database.js';

async function main() {
  console.log('Testing database connection and seeding initial system settings...');

  await prisma.system_settings.upsert({
    where: { key: 'biometric_offline_alert_enabled' },
    update: {},
    create: {
      key: 'biometric_offline_alert_enabled',
      value: 'true',
      type: 'boolean',
    },
  });

  await prisma.system_settings.upsert({
    where: { key: 'biometric_offline_threshold_minutes' },
    update: {},
    create: {
      key: 'biometric_offline_threshold_minutes',
      value: '60',
      type: 'number',
    },
  });

  console.log('Database connected & seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
