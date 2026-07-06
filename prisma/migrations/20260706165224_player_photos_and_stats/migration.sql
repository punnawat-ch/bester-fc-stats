-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'DF', 'MF', 'FW');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "jerseyNumber" INTEGER,
ADD COLUMN     "motm" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "position" "Position",
ADD COLUMN     "redCards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saves" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yellowCards" INTEGER NOT NULL DEFAULT 0;
