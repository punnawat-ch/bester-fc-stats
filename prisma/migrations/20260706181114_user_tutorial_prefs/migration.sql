-- AlterTable
ALTER TABLE "User" ADD COLUMN     "toursSeen" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tutorialEnabled" BOOLEAN NOT NULL DEFAULT true;
