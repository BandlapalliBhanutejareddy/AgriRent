const { prisma } = require('../dist/lib/prisma');

async function runAdditiveMigration() {
  console.log('Running non-destructive additive schema migration...');

  // 1. Add latitude and longitude to Farm
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
  `);
  console.log('✔ Farm latitude/longitude columns verified.');

  // 2. Create CommunityPost table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CommunityPost" (
      "id" TEXT PRIMARY KEY,
      "authorId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'GENERAL',
      "tags" TEXT,
      "imageUrl" TEXT,
      "likesCount" INTEGER NOT NULL DEFAULT 0,
      "viewsCount" INTEGER NOT NULL DEFAULT 0,
      "isReported" BOOLEAN NOT NULL DEFAULT false,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityPost_category_idx" ON "CommunityPost"("category");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");
  `);
  console.log('✔ CommunityPost table verified.');

  // 3. Create CommunityComment table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CommunityComment" (
      "id" TEXT PRIMARY KEY,
      "postId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "parentCommentId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityComment_postId_idx" ON "CommunityComment"("postId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityComment_createdAt_idx" ON "CommunityComment"("createdAt");
  `);
  console.log('✔ CommunityComment table verified.');

  // 4. Create CommunityReport table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CommunityReport" (
      "id" TEXT PRIMARY KEY,
      "reporterId" TEXT NOT NULL,
      "postId" TEXT,
      "commentId" TEXT,
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CommunityReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CommunityReport_status_idx" ON "CommunityReport"("status");
  `);
  console.log('✔ CommunityReport table verified.');

  // 5. Create FarmerAlert table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FarmerAlert" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "farmId" TEXT,
      "farmCropId" TEXT,
      "cropName" TEXT,
      "severity" TEXT NOT NULL DEFAULT 'ADVISORY',
      "category" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "recommendedAction" TEXT,
      "location" TEXT,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "isDismissed" BOOLEAN NOT NULL DEFAULT false,
      "expiresAt" TIMESTAMP(3),
      "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FarmerAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FarmerAlert_userId_idx" ON "FarmerAlert"("userId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FarmerAlert_category_idx" ON "FarmerAlert"("category");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FarmerAlert_createdAt_idx" ON "FarmerAlert"("createdAt");
  `);
  console.log('✔ FarmerAlert table verified.');

  // 6. Create FarmerAlertPreference table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FarmerAlertPreference" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL UNIQUE,
      "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
      "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
      "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
      "heavyRainAlerts" BOOLEAN NOT NULL DEFAULT true,
      "strongWindAlerts" BOOLEAN NOT NULL DEFAULT true,
      "heatStressAlerts" BOOLEAN NOT NULL DEFAULT true,
      "frostAlerts" BOOLEAN NOT NULL DEFAULT true,
      "dryConditionsAlerts" BOOLEAN NOT NULL DEFAULT true,
      "sprayingAdvisoryAlerts" BOOLEAN NOT NULL DEFAULT true,
      "cropStageAlerts" BOOLEAN NOT NULL DEFAULT true,
      "pestDiseaseAlerts" BOOLEAN NOT NULL DEFAULT true,
      "marketUpdateAlerts" BOOLEAN NOT NULL DEFAULT true,
      "quietHoursStart" TEXT,
      "quietHoursEnd" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FarmerAlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log('✔ FarmerAlertPreference table verified.');

  console.log('Additive migration completed successfully!');
}

runAdditiveMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

