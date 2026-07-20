// NBHD-01 — the geographic unit a neighbourhood's POI radius queries,
// walkability sampling and "Top X%" percentile are all anchored to.
// `boundary` polygons (GeoJSON) are ingested separately and not represented
// here; this is the lightweight identity + centroid + reference-frame view.
export interface NeighbourhoodBoundary {
  id: string
  slug: string
  name: string
  centroidLat: number | null
  centroidLng: number | null
  referenceRegion: string | null
}
