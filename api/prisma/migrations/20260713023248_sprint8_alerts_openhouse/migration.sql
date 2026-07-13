-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_LISTING', 'PRICE_DROP', 'STATUS_CHANGE', 'OPEN_HOUSE');

-- CreateEnum
CREATE TYPE "OpenHouseStatus" AS ENUM ('PLANNED', 'ATTENDED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "propertyId" TEXT,
    "ddfOpenHouseKey" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenHouseVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ddfOpenHouseKey" TEXT NOT NULL,
    "propertyId" TEXT,
    "status" "OpenHouseStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenHouseVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_userId_readAt_idx" ON "Alert"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Alert_userId_type_idx" ON "Alert"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_propertyId_type_key" ON "Alert"("userId", "propertyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_ddfOpenHouseKey_key" ON "Alert"("userId", "ddfOpenHouseKey");

-- CreateIndex
CREATE INDEX "OpenHouseVisit_userId_status_idx" ON "OpenHouseVisit"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OpenHouseVisit_userId_ddfOpenHouseKey_key" ON "OpenHouseVisit"("userId", "ddfOpenHouseKey");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenHouseVisit" ADD CONSTRAINT "OpenHouseVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
