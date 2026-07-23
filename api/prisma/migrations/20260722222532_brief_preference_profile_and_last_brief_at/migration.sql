-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastBriefAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserPreferenceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "timeline" TEXT,
    "homeType" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "bedroomsMin" INTEGER,
    "mortgage" TEXT,
    "workingWithRealtor" TEXT,
    "openToNearby" BOOLEAN,
    "lifestylePriorities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferredNeighbourhood" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreferredNeighbourhood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferenceProfile_userId_key" ON "UserPreferenceProfile"("userId");

-- CreateIndex
CREATE INDEX "UserPreferredNeighbourhood_profileId_idx" ON "UserPreferredNeighbourhood"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferredNeighbourhood_profileId_name_key" ON "UserPreferredNeighbourhood"("profileId", "name");

-- AddForeignKey
ALTER TABLE "UserPreferenceProfile" ADD CONSTRAINT "UserPreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferredNeighbourhood" ADD CONSTRAINT "UserPreferredNeighbourhood_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserPreferenceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
