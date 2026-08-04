# SEO Implementation Plan — non-DDF scope, parallel execution

_Created 2026-08-03. Companion to the `SEO-01…15` section in [TASKS.md](../TASKS.md)._

This plan implements every SEO task that **does not depend on CREA/DDF data**, so none of it
is gated on the SEO-05 compliance decision. Tracks are cut so that **no two concurrent tracks
touch the same file** — the phase boundaries below are conflict boundaries, not just
dependency boundaries.

## Scope

**In (11 items):** SEO-01, 02, 03 (non-DDF fields only), 04 (non-listing schemas only),
06, 07, 08, 09, 10, 13, 15.

**Out — DDF-dependent, deferred until SEO-05 resolves:**

| ID | Why excluded |
|---|---|
| SEO-05 | The compliance decision itself — this plan routes around it |
| SEO-11 | City landing pages need live listing counts + price stats |
| SEO-12 | Property URL slugs — 100% listing data |
| SEO-14 | Market reports are DDF-derived (the evergreen-guide half can revive later) |
| SEO-04 (part) | `RealEstateListing` / `Residence` on property detail |
| SEO-03 (part) | `marketSnapshot`, `liveListings`, `housingAge` stay **client-side** |

> Leaving the DDF fields client-rendered is deliberate and doubly correct: it keeps us clear
> of the indexing question, and the listing grid is commodity content every portal has —
> it is not what will rank or get cited. Server-render the livability half, which nobody else has.

## Data provenance — the line SEO-03 must respect

`NeighbourhoodDetailResponse` splits cleanly. Only the left column moves to the server.

| Server-render (ours / open data) | Leave client-side (DDF) |
|---|---|
| `neighbourhood` — name, bio, hero photo, boundary, centroid | `marketSnapshot` — median price, 30d change, DOM, active listings |
| `livability` — composite, percentile, all four sub-scores, `region`, `weightsVersion` | `liveListings` — `PropertySummary[]` |
| `localEssentials` — schools, healthcare, parks, shopAndEat, transit, transitBus (OSM) | `housingAge` — build-year profile *of active listings* |
| `localInfoTiles` — static map + street view | `Neighbourhood.medianPrice` (backfilled from live DDF prices) |

`personalization` is per-user — keep it client-side regardless, and it must never be indexed.

## Phase 1 — six tracks, fully parallel

Branch each track off `main`. No two tracks share a file, so they can merge in any order.

| Track | Task | Files owned (exclusive) |
|---|---|---|
| **A** Crawl surface | SEO-01 → SEO-07 | `src/app/robots.ts` (new) · `src/app/sitemap.ts` (new) · `src/app/llms.txt/route.ts` (new) · `src/lib/api/sitemap-data.ts` (new) |
| **B1** Index SSR | SEO-02 | `src/app/(main)/neighbourhoods/page.tsx` · `src/components/neighbourhood/NeighbourhoodsClient.tsx` |
| **B2** Detail SSR | SEO-03 | `src/app/(main)/neighbourhoods/[slug]/page.tsx` · `src/components/neighbourhood/NeighbourhoodDetailBody.tsx` · `src/hooks/useNeighbourhoodDetail.ts` |
| **C** Schema foundation | SEO-04 | `src/lib/schema.ts` (new) · `src/components/seo/JsonLd.tsx` (new) · `src/app/layout.tsx` |
| **D** Homepage | SEO-06 | `src/app/page.tsx` · `src/lib/strings.ts` |
| **E** Methodology | SEO-08 | `src/app/(main)/methodology/**` (new) |

### Track A — crawl surface

`sitemap.ts` must be DB-driven off `Neighbourhood`, never a hardcoded slug list.

- **`lastModified`: use `livabilityComputedAt`, not `updatedAt`.** The model has no `updatedAt`
  column (unlike most others in the schema) — and `livabilityComputedAt` is the better signal
  anyway, since it marks when the page's substantive content actually changed. Fall back to
  `createdAt` where null.
- Put the query in a **new** `src/lib/api/sitemap-data.ts` rather than extending
  `src/lib/api/neighbourhoods.ts` — that file is adjacent to Track B2's work and this keeps
  the tracks disjoint.
- Emit static routes + 41 neighbourhood URLs. **No listing URLs** (SEO-05).
- SEO-07 follows in the same track because it edits `robots.ts`: allow `GPTBot`, `ClaudeBot`,
  `PerplexityBot`, `ChatGPT-User`, `Google-Extended` **explicitly**. Having no robots.txt is
  permissive today; adding one that omits them is a silent block.
- ⚠️ **Build the sitemap, do not submit it.** See "Sequencing trap" below.

### Track B1 — neighbourhood index

`page.tsx` already fetches all rows server-side, then hands everything to `NeighbourhoodsClient`,
so the HTML contains **zero links** to the 41 detail pages. Render the anchor grid in the server
component; let the client component filter and reorder on top of it. The links must exist with
JS disabled.

### Track B2 — neighbourhood detail

The prop-threading job:

1. `page.tsx` already calls `getNeighbourhood(slug)`; add `getNeighbourhoodDetail(slug)` (already
   an async server-callable in `src/lib/api/neighbourhoods.ts`).
2. Pass the payload into `NeighbourhoodDetailBody` as a new prop.
3. `useNeighbourhoodDetail` currently takes only `slug` and has **no `initialData`** — extend it
   to accept the server payload and seed the query with it. Keep `staleTime: 300_000`.
4. Strip the DDF fields from the server payload before it reaches HTML (see provenance table);
   those sections keep their existing client fetch and loading states.

Keep `NeighbourhoodCTA` and the section spine order untouched — this is data plumbing, not a redesign.

### Track C — schema foundation

Own `src/lib/schema.ts` outright and ship **every** builder in this phase, including the ones
Phase 2 consumes: `Organization`, `WebSite`, `BreadcrumbList`, `Place`, `AggregateRating`,
`TechArticle`, `FAQPage`. Shipping them all here is what lets Phase 2 run parallel — those tracks
then only touch their own route files.

Wire `Organization` + `WebSite` into `layout.tsx`. **No `RealEstateListing`** (SEO-05).

### Track D — homepage

Two independent changes in one file: swap `force-dynamic` for `revalidate = 3600`, and give the
H1 keyword weight. Copy lives in `STRINGS`, not inline.

> The ISR change caches already-rendered featured listings; it consumes no new DDF data and is
> well inside normal refresh expectations. Flagging it only because it is the one in-scope item
> that touches a DDF-fed surface at all.

### Track E — methodology

Publish `docs/livability-methodology.md` and `docs/walkability-methodology.md` as real routes with
proper heading structure. Ship the pages here; JSON-LD and the inbound link from `LivabilityPanel`
land in Phase 2 (that component is adjacent to Track B2's area — deferring avoids the one
near-collision in this phase).

---

## Phase 2 — three tracks, parallel

Starts when Phase 1 has merged. Each track wires JSON-LD from Track C's builders into its own
route files — no shared files.

| Track | Task | Files owned |
|---|---|---|
| **F** | SEO-09 — `Place` + `AggregateRating` + `FAQPage` on neighbourhood detail | `src/app/(main)/neighbourhoods/[slug]/page.tsx` |
| **G** | SEO-15 — comparison pages | `src/app/(main)/neighbourhoods/compare/**` (new) |
| **H** | Methodology JSON-LD + `LivabilityPanel` link | `src/app/(main)/methodology/**` · `src/components/neighbourhood/LivabilityPanel.tsx` |

**Track G — comparison pages.** `/neighbourhoods/kitsilano-vs-mount-pleasant`, built entirely from
livability sub-scores and POI counts. Best volume-to-winnability ratio in the whole plan, and 100%
non-DDF. ⚠️ **Do not generate all 820 pairs** — pick the ~100 that are genuinely comparable (same
city, adjacent, or similar tier). Thin permutations are a duplicate-content penalty, not a win.
Reuse Track B2's server-fetch pattern.

---

## Phase 3 — serial

| Step | Task | Why serial |
|---|---|---|
| 1 | SEO-10 — canonical + `noindex` sweep | Rewrites metadata blocks across routes every prior track touched. Must run alone |
| 2 | Extend `sitemap.ts` with `/methodology` + `/compare` routes | One-line follow-up once those routes exist |
| 3 | SEO-13 — verification pass | Acceptance gate for the whole effort |
| 4 | **Submit sitemap in Search Console** | Only now — see below |

SEO-10 scope: self-referencing canonicals on every indexable route; `noindex` on filter
permutations beyond a whitelisted param set; canonical on property detail pointing at the
standalone URL (not the `@propertyModal` interception); `noindex` on `/dashboard`, `/feed`,
`/onboarding`, `/sign-in`, `/sign-up`.

---

## ⚠️ Sequencing trap — do not submit the sitemap early

SEO-01 is cheap and tempting to ship first. **Build it in Phase 1; submit it in Phase 3.**

If Google discovers 41 neighbourhood URLs while they still render as empty shells, it indexes them
as thin pages — and first-crawl quality assessments are slow to overturn. That spends the one good
first impression on a blank page. The file can exist on production the whole time; what matters is
not requesting a crawl until the SSR work is live.

## Acceptance criteria

The real test for the whole plan is **fetch with JavaScript disabled**:

- `/neighbourhoods` → ~112 `<a href="/neighbourhoods/...">` present in raw HTML (see note below)
- `/neighbourhoods/<slug>` → livability sub-scores, region/percentile/weights version, and all
  local essentials present in raw HTML; listing grid and market snapshot **absent** (expected).
  ⚠️ **Not `bio`** — see SEO-17: every row's bio is null, so there is no prose to render.
- `/robots.txt` and `/sitemap.xml` → 200, sitemap lists ~112 neighbourhood URLs + 9 static routes
- **Production build** confirms `/neighbourhoods` is not opted out of prerendering — `next dev`
  renders on demand and cannot reproduce a bailout, so dev verification is insufficient here

> **~112, and don't hardcode it.** Earlier drafts said 41, then 31. Both were estimates replayed
> against `metro-vancouver-neighbourhoods.ts` alone; the database actually holds ~416 rows because
> `bc-neighbourhoods.ts` seeds province-wide. Measured live against the prod API, `LAUNCH_CITIES`
> yields **112**.
>
> The number does not need to be right anywhere in code: both the sitemap and the index grid
> filter on `isLaunchCity` at runtime, so they agree by construction and track the data as it
> changes. Rows outside `LAUNCH_CITIES` sit on unverified centroids and, per the filter's own
> comment, "would show collapsed or wrong scores" — indexing those would contradict the
> methodology pages shipping in the same branch, and the risk is asymmetric: bad pages take weeks
> to clear from an index, while widening `LAUNCH_CITIES` widens both surfaces automatically.
- `/methodology/*` → full text in raw HTML
- Every JSON-LD block passes Google's Rich Results Test
- No `noindex` on any indexable route; `noindex` present on all five private routes

## Timeline

**Implementation is ~1–1.5 days of focused work, not a week.** Most of these tasks are mechanical;
only SEO-03 (prop threading without leaking DDF fields into SSR), SEO-15 (pair selection) and
SEO-10 (not `noindex`-ing something load-bearing) need real care.

The `S`/`M` sizes carried in TASKS.md are the tracker's human-developer estimates and sum to
~11.5 days serial. Do not read them as wall clock for a single focused implementer — they are
there for consistency with the rest of the tracker.

**The track structure above is a merge-safety map, not a schedule.** At this size the coordination
cost of six branches exceeds what parallelism saves. Use the file-ownership tables to avoid
conflicts if several people or agents *do* work concurrently; otherwise just run the phases in
order.

### What actually consumes calendar time

1. **Decisions that need a human** — homepage H1 copy (brand), which ~100 comparison pairs are
   legitimate, what the methodology pages disclose publicly, whether 1h ISR on featured listings
   is acceptable.
2. **Review + deploy cycles** — Netlify build, prod verification, diff review.
3. **Indexing latency — the dominant term.** Google takes days-to-weeks to recrawl, reindex and
   re-rank; AI crawlers are slower. **Expect 3–8 weeks before results are visible**, regardless of
   how fast the code ships. Plan measurement windows accordingly — judging this work at 1 week
   will read as failure when it is simply not yet crawled.
