-- NBHD-01 — neighbourhood boundaries + percentile reference frame.
-- Boundary is stored as GeoJSON in a JSONB column (no PostGIS extension).
ALTER TABLE "Neighbourhood" ADD COLUMN "boundary" JSONB;
ALTER TABLE "Neighbourhood" ADD COLUMN "centroidLat" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "centroidLng" DOUBLE PRECISION;
ALTER TABLE "Neighbourhood" ADD COLUMN "referenceRegion" TEXT;
