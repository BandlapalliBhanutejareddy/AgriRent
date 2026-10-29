const { prisma } = require('../dist/lib/prisma');

async function main() {
  const farmCols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Farm' ORDER BY ordinal_position"
  );
  console.log('Farm columns in DB:', farmCols);

  const tables = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Tables in DB:', tables.map(t => t.table_name));
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

