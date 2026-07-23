-- VIBE-01 — "neighbourhood vibe" raw inputs from OSM ways (bike infra length,
-- green land-use coverage, and proximity to major noise sources). These are
-- derived from ways/polygons, not point POIs, so they live on the Neighbourhood
-- row rather than in NeighbourhoodPoi. Data-only; scoring/UI are downstream.
ALTER TABLE "Neighbourhood" ADD COLUMN "bikeLaneKm" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "greenCoverPct" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "nearestMajorRoadM" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "nearestRailM" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "nearestAirportM" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "vibeMetricsVersion" TEXT;
ALTER TABLE "Neighbourhood" ADD COLUMN "vibeMetricsComputedAt" TIMESTAMP(3);
