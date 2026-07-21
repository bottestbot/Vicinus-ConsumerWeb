-- NBHD-02 — raw OSM/Overpass POIs, snapshotted per ingestion run.
CREATE TABLE "NeighbourhoodPoi" (
    "id" TEXT NOT NULL,
    "neighbourhoodId" TEXT NOT NULL,
    "osmId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "snapshotVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeighbourhoodPoi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NeighbourhoodPoi_neighbourhoodId_idx" ON "NeighbourhoodPoi"("neighbourhoodId");
CREATE INDEX "NeighbourhoodPoi_neighbourhoodId_category_idx" ON "NeighbourhoodPoi"("neighbourhoodId", "category");
CREATE INDEX "NeighbourhoodPoi_neighbourhoodId_snapshotVersion_idx" ON "NeighbourhoodPoi"("neighbourhoodId", "snapshotVersion");

ALTER TABLE "NeighbourhoodPoi" ADD CONSTRAINT "NeighbourhoodPoi_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
