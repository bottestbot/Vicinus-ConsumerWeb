-- AlterTable
ALTER TABLE "EditorialCuration" ADD COLUMN     "category" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtitle" TEXT;
