-- Dedupe existing VisitedProperty rows before adding the unique constraint.
-- trackVisited previously did deleteMany+create (non-atomic), so a doubled
-- effect call (React double-invoke, duplicate mount) could insert two rows
-- for the same (userId, propertyId). Keep the most recent visit per pair,
-- drop the rest.
DELETE FROM "VisitedProperty" a
USING "VisitedProperty" b
WHERE a."userId" = b."userId"
  AND a."propertyId" = b."propertyId"
  AND (
    a."visitedAt" < b."visitedAt"
    OR (a."visitedAt" = b."visitedAt" AND a."id" > b."id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "VisitedProperty_userId_propertyId_key" ON "VisitedProperty"("userId", "propertyId");
