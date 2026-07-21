# Livability Methodology

**Vicinus neighbourhood composite** · Weights version: `v1` · Last updated: 2026-07-21

Backs the "How we calculate this" link on the neighbourhood detail page. For the
walkability sub-index in detail, see [walkability-methodology.md](./walkability-methodology.md).

---

## What this measures

A single 0–100 score summarising how well a neighbourhood supports day-to-day
life, blended from four sub-indices, plus a **"Top X% in British Columbia"**
percentile so the number has a reference point.

Every input is deterministic and reproducible — no model, no LLM. The AI layer
personalises *weighting* and *explanation* (see [Personalization](#personalization)),
never the underlying scores.

## The blend

```
Livability = Walkability × 0.30
           + Schools     × 0.25
           + Amenities   × 0.25
           + Transit     × 0.20
```

Weighted arithmetic mean of four 0–100 sub-indices.

### Missing dimensions

If a sub-index is unavailable, it is **dropped and the remaining weights are
renormalized to sum to 1** — a neighbourhood is never penalised for data we
don't have.

This is currently the norm, not the exception: **transit is `null` everywhere**
because no agency GTFS feed is wired up yet. In practice today the blend is:

| Dimension | Nominal | Effective (no transit) |
|---|---|---|
| Walkability | 0.30 | 0.375 |
| Schools | 0.25 | 0.3125 |
| Amenities | 0.25 | 0.3125 |
| Transit | 0.20 | — |

## The sub-indices

### Walkability (0.30)

Distance-decayed, variety-weighted access to nine categories of everyday
destination. Full detail in [walkability-methodology.md](./walkability-methodology.md).

### Schools (0.25)

**Locations only — no school ratings.** Vicinus does not publish or rank school
quality; Canadian rating data is contested and licence-encumbered, so the score
reflects *access*, not quality.

```
Schools = 100 × (0.6 × nearestSchoolAccess + 0.4 × levelCoverage)
```

- **Proximity (60%)** — distance decay to the nearest school of any level: full
  credit ≤ 800m, decaying to 0 at 3000m.
- **Level coverage (40%)** — how many of elementary / middle / secondary are
  represented, as a fraction of three.

Level is inferred from the POI name (`elementary`/`primary`, `middle`/`junior`,
`secondary`/`high school`), because OSM rarely tags `isced:level`. A school whose
name doesn't identify a level counts toward **proximity only**.

> An earlier version credited unlabelled schools to all three levels. Because most
> OSM schools are unlabelled, that handed a perfect 100 to any area with a single
> school of unknown type — it was inventing coverage it had no evidence for.

### Amenities (0.25)

Distance-decayed POI density with a hard **cap of 3 per category**, so variety
beats raw count. Full credit ≤ 400m, decaying to 0 at 2000m; normalized against
all nine categories at full strength (9 × 3 = 27).

The tighter decay band and per-category cap deliberately differ from walkability's
formulation so the two indices aren't measuring the same thing twice.

### Transit (0.20)

Per-stop service level from agency GTFS (TransLink / BC Transit), weighted by
peak trips per day and distance-decayed from the centroid.

**Status: not yet available.** Decision (2026-07-20): build from agency GTFS —
no paid Transit Score API. Until a feed path is configured
(`TRANSLINK_GTFS_PATH` or `BC_TRANSIT_GTFS_PATH`), this returns
`{ score: null, source: 'unavailable' }` and its weight is redistributed.

### Why healthcare is excluded

Hospitals and pharmacies **are** ingested and shown on the page as local
information, but they are **deliberately not part of the livability blend**.

Proximity to a hospital is not the same as access to healthcare — that depends on
catchment, referrals, specialty, and wait times, none of which are in OSM. Worse,
living next to a hospital is often a *negative* for noise and traffic. Scoring it
as a positive would be misleading, so it stays context, not score.

## Percentile ranking

The "Top X%" label ranks a neighbourhood against its **reference region**:

```
percentile = 100 × (neighbourhoods in region scoring at or below this one) / (region total)
Top X%     = 100 − percentile
```

### Reference frame: province

NBHD-01 called for choosing between city, metro, and province. **Province is the
v1 frame.**

City was tried first and is unusable: most cities in the dataset contain exactly
one neighbourhood, so every neighbourhood ranked in the 100th percentile against
itself. Metro area would be the ideal grain — "Top 10% in Metro Vancouver" is more
meaningful to a buyer than "in BC" — but the schema has no metro field, so
province (417 BC rows) is the coarsest-but-meaningful pool available.

`Neighbourhood.referenceRegion` can be set explicitly per row and always wins over
the province default, so a metro grouping can be introduced without a code change.

## Versioning and reproducibility

Every scoring run persists its inputs and provenance:

| Column | Meaning |
|---|---|
| `livabilityScore` | The 0–100 composite |
| `walkabilityScore`, `schoolsScore`, `amenitiesScore`, `transitSubScore` | Sub-indices |
| `livabilityPercentile` | Rank within `referenceRegion` |
| `livabilityWeightsVersion` | Weight set used (`v1`) |
| `livabilityComputedAt` | When it was computed |
| `referenceRegion` | Pool the percentile was taken against |
| `NeighbourhoodPoi.snapshotVersion` | Quarterly OSM snapshot the score was built from |

Changing the weights means bumping `livabilityWeightsVersion` — scores from
different versions are not comparable.

### Null, never zero

A neighbourhood with no POI snapshot is left **`null`**, not scored 0. A failed
Overpass fetch is indistinguishable from a genuinely amenity-free area if you
write a 0, and one bogus 0 drags down the percentile of every other neighbourhood
in the pool.

## Personalization

For signed-in users, the same sub-indices are re-blended using **personal
weights** derived from stated onboarding priorities (`walkability`, `schools`,
`transit`/`commute`, `dining`/`parks`), producing a **match %** alongside the
neutral livability score. Reason and caution chips are templated from the
sub-scores — transparent, not generative.

Users with no stated priorities get the default weights and `isPersonalized:
false` (the cold-start state). LLM-synthesised narrative is deferred to a later
AI release.

## Observed distribution

Across 15 real BC neighbourhoods after calibration:

| Livability | Percentile | Neighbourhood |
|---|---|---|
| 95.8 | Top 1% | Downtown, Mission |
| 92.8 | Top 13% | Fairview, Vancouver |
| 86.0 | Top 33% | Brentwood, Burnaby |
| 66.8 | Top 67% | Cloverdale, Surrey |
| 46.6 | Top 87% | Lantzville, Lantzville |
| 7.7 | Top 93% | Daajing Giids, Daajing Giids |

Range 7.7–95.8, with nothing pinned at 100 — see
[walkability-methodology.md § Calibration](./walkability-methodology.md#calibration)
for why saturation was the main risk here.

## Where it lives

| | |
|---|---|
| Blend + percentile | `api/src/modules/neighbourhoods/scoring/livability.service.ts` |
| Weights + redistribution | `api/src/modules/neighbourhoods/scoring/blend.ts` |
| Sub-scorers | `scoring/walkability.service.ts`, `scoring/schools-amenities.service.ts`, `scoring/transit.service.ts` |
| Personalization | `scoring/personalization.service.ts` |
| Served by | `GET /neighbourhoods/:slug/detail` |
| Batch job | `cd api && npm run scores:neighbourhoods` |

Scoring is an offline batch job. The detail endpoint only ever reads precomputed
columns — no scoring happens in the request path.
