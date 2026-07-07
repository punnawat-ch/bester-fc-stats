-- CreateEnum
CREATE TYPE "AppearanceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Club" ADD COLUMN "activeAppearanceId" TEXT;

-- CreateTable
CREATE TABLE "AppearanceRevision" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "status" "AppearanceStatus" NOT NULL DEFAULT 'DRAFT',
    "tokens" JSONB NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppearanceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_activeAppearanceId_key" ON "Club"("activeAppearanceId");

-- CreateIndex
CREATE INDEX "AppearanceRevision_clubId_status_createdAt_idx" ON "AppearanceRevision"("clubId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_activeAppearanceId_fkey" FOREIGN KEY ("activeAppearanceId") REFERENCES "AppearanceRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceRevision" ADD CONSTRAINT "AppearanceRevision_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceRevision" ADD CONSTRAINT "AppearanceRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
