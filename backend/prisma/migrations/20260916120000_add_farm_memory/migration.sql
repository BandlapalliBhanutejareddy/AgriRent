-- CreateTable
CREATE TABLE "FarmMemory" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "payload" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmMemory_farmId_occurredAt_idx" ON "FarmMemory"("farmId", "occurredAt");

-- CreateIndex
CREATE INDEX "FarmMemory_farmId_eventType_idx" ON "FarmMemory"("farmId", "eventType");

-- CreateIndex
CREATE INDEX "FarmMemory_subjectType_subjectId_idx" ON "FarmMemory"("subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "FarmMemory" ADD CONSTRAINT "FarmMemory_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;