# Walkability Methodology

**Vicinus livability sub-index** · Weights version: `v1` · Last updated: 2026-07-21

Backs the "How we calculate this" link on the neighbourhood detail page. For the
composite that consumes this score, see [livability-methodology.md](./livability-methodology.md).

---

## What this measures

How much of daily life is reachable on foot from a neighbourhood's centre — how
many everyday destinations are nearby, how close they are, and whether they cover
a *variety* of needs rather than ten of the same thing.

It is **not** a measure of how pleasant the walk is. Sidewalk quality, traffic,
crossings, and terrain are not modelled in v1 (see [Limitations](#limitations)).

## Data source

**OpenStreetMap**, queried via the [Overpass API](https://overpass-api.de/).
POIs are pulled within a 1500m radius of the neighbourhood centroid and stored
locally with a quarterly snapshot tag (`snapshotVersion`, e.g. `2026-Q3`) so a
score can always be reproduced against the data that produced it.

> Map data © OpenStreetMap contributors, available under the
> [Open Database License (ODbL)](https://www.openstreetmap.org/copyright).

Decision (2026-07-20): **built from OSM — no paid Walk Score API.** No Google
Places hybrid in v1; Places is used only for map/Street View tiles, not scoring.

### Categories

OSM tags are mapped into nine categories:

| Category | Source tags |
|---|---|
| `grocery` | `amenity=supermarket`, `shop=supermarket`, `shop=convenience` |
| `restaurants` | `amenity=restaurant` |
| `coffee` | `amenity=cafe` |
| `schools` | `amenity=school` |
| `parks` | `amenity=park`, `leisure=park`, `leisure=playground` |
| `banks` | `amenity=bank` |
| `healthcare` | `amenity=hospital`, `amenity=pharmacy` |
| `entertainment` | `amenity=bar` |
| `errands` | any other `shop=*` |

## How the score is computed

### 1. Walking distance

Straight-line (haversine) distance from the centroid, multiplied by a **1.4
detour factor** — a real pedestrian route is longer than the crow flies.

This is a deliberate v1 shortcut. True network distance (osmnx + pandana over the
OSM pedestrian graph) is deferred; see [Limitations](#limitations).

### 2. Distance decay

Each POI earns credit between 0 and 1 based on how far it is:

- **≤ 400m** — full credit (1.0). About a five-minute walk.
- **400m → 2400m** — linear decay from 1.0 to 0.
- **≥ 2400m** — no credit (0).

### 3. Diminishing returns

Per-category credit is summed, then capped at **10** and passed through
`log(1 + n)`. The first grocery store matters enormously; the eighth adds very
little. Without this, a dense commercial strip would swamp every other signal.

### 4. Category weights

| Category | Weight | | Category | Weight |
|---|---|---|---|---|
| `grocery` | 1.5 | | `errands` | 1.0 |
| `restaurants` | 1.2 | | `banks` | 0.8 |
| `coffee` | 1.0 | | `healthcare` | 0.8 |
| `parks` | 1.0 | | `entertainment` | 0.8 |
| `schools` | 1.0 | | **Total** | **9.1** |

Groceries are weighted highest because they are the most frequent non-work trip.

### 5. Normalization to 0–100

```
score = 100 × weightedTotal / MAX_ATTAINABLE
MAX_ATTAINABLE = log(1 + 10) × 9.1 ≈ 21.82
```

The anchor is **derived from the maximum attainable total**, not hand-tuned. A
score is therefore "what fraction of the best possible outcome this neighbourhood
achieves", and changing the weights or the cap cannot silently re-scale the index.

## Calibration

The anchor was originally a fixed guess of `14`, calibrated against a synthetic
13-POI test fixture. Real Overpass data returns far more — Fairview, Vancouver
alone yields **1082 POIs** within 1500m — so the weighted total blew past 14 and
clamped.

Measured raw totals across 15 real BC neighbourhoods ranged **2.35 → 21.82**
against a ceiling of 21.82. With the fixed anchor of 14, **9 of 15 scored exactly
100**, which also made the livability percentile meaningless (everything tied).

Deriving the anchor from the ceiling produced a usable spread:

| Walkability | Neighbourhood | POIs |
|---|---|---|
| 100 | Downtown, Mission | 1941 |
| 95 | Fairview, Vancouver | 1082 |
| 90 | Moody Park, New Westminster | 461 |
| 83 | Brentwood, Burnaby | 282 |
| 61 | Gibsons, Gibsons | 87 |
| 37 | Scottsdale, Delta | 40 |
| 29 | Lantzville, Lantzville | 21 |
| 11 | Daajing Giids, Daajing Giids | 9 |

Anyone re-tuning the weights or the cap should re-run this comparison — the
lesson from v1 is that a constant calibrated on synthetic data will not survive
contact with real POI density.

## Limitations

Known and accepted for v1:

- **Straight-line distance × 1.4, not network routing.** Ignores rivers,
  highways, rail lines, and cul-de-sacs. A neighbourhood across an uncrossable
  barrier from its amenities scores too high.
- **No pedestrian-friendliness multiplier.** Intersection density and block
  length are specified but not implemented, so sidewalk quality, traffic, and
  crossing frequency do not affect the score.
- **Centroid sampling, not a grid.** One point per neighbourhood rather than the
  median of grid-sampled points, so large or irregular neighbourhoods are
  represented by their centre only.
- **OSM completeness varies.** Coverage is excellent in urban BC and thinner in
  rural areas, which can understate small towns.
- **Category caps are uniform.** Every category caps at 10 decayed POIs
  regardless of how many of that type a neighbourhood realistically needs.

## Where it lives

| | |
|---|---|
| Scorer | `api/src/modules/neighbourhoods/scoring/walkability.service.ts` |
| Distance/decay helpers | `api/src/modules/neighbourhoods/scoring/geo.ts` |
| POI ingestion | `api/src/modules/neighbourhoods/poi-ingestion.service.ts` |
| Stored on | `Neighbourhood.walkabilityScore` |
| Batch job | `cd api && npm run scores:neighbourhoods` |

A neighbourhood with **no POI snapshot** is left `null`, never scored 0 — a
failed data fetch must not be reported as "nothing is nearby".
