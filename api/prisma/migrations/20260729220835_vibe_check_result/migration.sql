-- CreateTable
CREATE TABLE "VibeCheckResult" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "archetypeKey" TEXT NOT NULL,
    "matchedNeighbourhoodId" TEXT NOT NULL,
    "matchPercent" INTEGER NOT NULL,
    "matchRarityPct" DOUBLE PRECISION,
    "runnerUpIds" JSONB NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredByResultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibeCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VibeCheckResult_shortId_key" ON "VibeCheckResult"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "VibeCheckResult_referralCode_key" ON "VibeCheckResult"("referralCode");

-- CreateIndex
CREATE INDEX "VibeCheckResult_sessionId_idx" ON "VibeCheckResult"("sessionId");

-- CreateIndex
CREATE INDEX "VibeCheckResult_userId_idx" ON "VibeCheckResult"("userId");

-- CreateIndex
CREATE INDEX "VibeCheckResult_matchedNeighbourhoodId_idx" ON "VibeCheckResult"("matchedNeighbourhoodId");

-- AddForeignKey
ALTER TABLE "VibeCheckResult" ADD CONSTRAINT "VibeCheckResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VibeCheckResult" ADD CONSTRAINT "VibeCheckResult_matchedNeighbourhoodId_fkey" FOREIGN KEY ("matchedNeighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VibeCheckResult" ADD CONSTRAINT "VibeCheckResult_referredByResultId_fkey" FOREIGN KEY ("referredByResultId") REFERENCES "VibeCheckResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
