const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseMetrics() {
  console.log('=== SUPABASE POSTGRESQL METRICS & HEALTH ANALYSIS ===\n');

  try {
    // 1. Connection count
    const connections = await prisma.$queryRawUnsafe(`
      SELECT count(*) as total_connections,
             count(*) FILTER (WHERE state = 'active') as active_connections,
             count(*) FILTER (WHERE state = 'idle') as idle_connections,
             count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_trans
      FROM pg_stat_activity;
    `);
    console.log('1. Connection Stats:', connections);

    // 2. Database Size
    const dbSize = await prisma.$queryRawUnsafe(`
      SELECT pg_database.datname,
             pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE datname = current_database();
    `);
    console.log('\n2. Database Size:', dbSize);

    // 3. Largest Tables & Index Sizes
    const tableSizes = await prisma.$queryRawUnsafe(`
      SELECT relname AS table_name,
             pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
             pg_size_pretty(pg_relation_size(relid)) AS data_size,
             pg_size_pretty(pg_indexes_size(relid)) AS index_size
      FROM pg_catalog.pg_statio_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `);
    console.log('\n3. Top 10 Tables by Size:', tableSizes);

    // 4. Cache Hit Ratio
    const cacheHitRatio = await prisma.$queryRawUnsafe(`
      SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read) + 0.0001) * 100 AS buffer_cache_hit_ratio
      FROM pg_statio_user_tables;
    `);
    console.log('\n4. Buffer Cache Hit Ratio (%):', cacheHitRatio);

    // 5. Postgres Memory Configuration
    const memSettings = await prisma.$queryRawUnsafe(`
      SELECT name, setting, unit, short_desc
      FROM pg_settings
      WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size', 'max_connections');
    `);
    console.log('\n5. Memory & Connection Limits:', memSettings);

  } catch (err) {
    console.error('Error querying database metrics:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseMetrics();
