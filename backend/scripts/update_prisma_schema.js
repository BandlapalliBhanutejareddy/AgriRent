const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add relations to User model
const userTarget = '  communityMessages CommunityMessage[]\n}';
const userReplacement = `  communityMessages CommunityMessage[]
  communityPosts    CommunityPost[]
  communityComments CommunityComment[]
  communityReports  CommunityReport[]
  farmerAlerts      FarmerAlert[]
  alertPreference   FarmerAlertPreference?
}`;
content = content.replace(userTarget, userReplacement);

// 2. Add latitude and longitude to Farm model
const farmTarget = '  soilType   String\n  createdAt  DateTime @default(now())';
const farmReplacement = `  soilType   String
  latitude   Float?
  longitude  Float?
  createdAt  DateTime @default(now())`;
content = content.replace(farmTarget, farmReplacement);

// 3. Append CommunityPost, CommunityComment, CommunityReport, FarmerAlert, FarmerAlertPreference
const newModels = `

// ============================================================
// PHASE 4 & 5 — FARMER COMMUNITY & ACTIONABLE ALERTS
// ============================================================

model CommunityPost {
  id          String             @id @default(cuid())
  authorId    String
  title       String
  content     String
  category    String             @default("GENERAL") // CROPS, EQUIPMENT, PESTS_DISEASES, IRRIGATION, WEATHER, MARKETS, GENERAL
  tags        String?
  imageUrl    String?
  likesCount  Int                @default(0)
  viewsCount  Int                @default(0)
  isReported  Boolean            @default(false)
  status      String             @default("ACTIVE")
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @default(now()) @updatedAt

  author      User               @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments    CommunityComment[]
  reports     CommunityReport[]

  @@index([authorId])
  @@index([category])
  @@index([createdAt])
}

model CommunityComment {
  id              String        @id @default(cuid())
  postId          String
  authorId        String
  content         String
  parentCommentId String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @default(now()) @updatedAt

  post            CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  author          User          @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([authorId])
  @@index([createdAt])
}

model CommunityReport {
  id         String         @id @default(cuid())
  reporterId String
  postId     String?
  commentId  String?
  reason     String
  status     String         @default("PENDING") // PENDING, REVIEWED, RESOLVED, DISMISSED
  createdAt  DateTime       @default(now())

  reporter   User           @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  post       CommunityPost? @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([reporterId])
  @@index([status])
}

model FarmerAlert {
  id                String    @id @default(cuid())
  userId            String
  farmId            String?
  farmCropId        String?
  cropName          String?
  severity          String    @default("ADVISORY") // CRITICAL, WARNING, ADVISORY, INFO
  category          String
  title             String
  description       String
  recommendedAction String?
  location          String?
  isRead            Boolean   @default(false)
  isDismissed       Boolean   @default(false)
  expiresAt         DateTime?
  issuedAt          DateTime  @default(now())
  createdAt         DateTime  @default(now())

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([category])
  @@index([createdAt])
}

model FarmerAlertPreference {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  preferredLanguage      String   @default("en")
  inAppEnabled           Boolean  @default(true)
  pushEnabled            Boolean  @default(false)
  heavyRainAlerts        Boolean  @default(true)
  strongWindAlerts       Boolean  @default(true)
  heatStressAlerts       Boolean  @default(true)
  frostAlerts            Boolean  @default(true)
  dryConditionsAlerts    Boolean  @default(true)
  sprayingAdvisoryAlerts Boolean  @default(true)
  cropStageAlerts        Boolean  @default(true)
  pestDiseaseAlerts      Boolean  @default(true)
  marketUpdateAlerts     Boolean  @default(true)
  quietHoursStart        String?
  quietHoursEnd          String?
  updatedAt              DateTime @default(now()) @updatedAt

  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;

content += newModels;

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('schema.prisma updated successfully.');

