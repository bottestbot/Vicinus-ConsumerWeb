-- NBHD-07 — livability composite + sub-scores + versioned reproducible storage.
-- `transitSubScore` is distinct from the legacy seeded `transitScore INT` column,
-- which is intentionally left untouched.
ALTER TABLE "Neighbourhood" ADD COLUMN "livabilityScore" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "walkabilityScore" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "transitSubScore" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "schoolsScore" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "amenitiesScore" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "livabilityPercentile" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "livabilityWeightsVersion" TEXT;
ALTER TABLE "Neighbourhood" ADD COLUMN "livabilityComputedAt" TIMESTAMP(3);
