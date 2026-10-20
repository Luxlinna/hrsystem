import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check which database we're connected to
    const dbUrl = process.env.DATABASE_URL || '';
    const isTest = dbUrl.includes('mltkqbcjavgfclitgvin');
    console.log(`\n🔍 Connected to: ${isTest ? 'TEST ✅' : 'PRODUCTION ❌'}`);
    console.log(`   Host: ${dbUrl.match(/@([^:]+)/)?.[1] || 'unknown'}\n`);

    // List schemas
    const schemas = await prisma.$queryRawUnsafe(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name"
    );
    console.log('Schemas:', schemas.map(s => s.schema_name).join(', '));

    // List public tables
    const publicTables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log(`\nPublic tables (${publicTables.length}):`, publicTables.map(t => t.tablename).join(', '));

    // Check rows in _prisma_migrations
    const migrations = await prisma.$queryRawUnsafe(
      "SELECT count(*)::int as count FROM public._prisma_migrations WHERE finished_at IS NOT NULL"
    );
    console.log(`\nSuccessfully applied migrations: ${migrations[0]?.count} / 171`);



    // List auth tables
    const authTables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'auth' ORDER BY tablename"
    );
    console.log(`\nAuth tables (${authTables.length}):`, authTables.map(t => t.tablename).join(', '));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
