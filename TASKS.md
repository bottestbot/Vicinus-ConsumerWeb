# Vicinus — Task Tracker
_Last updated: 2026-07-03_

## Legend
- Severity: P0 (blocking) · P1 (significant) · P2 (polish)
- Status: [x] done · [~] partial · [ ] todo

## 🚀 Realtor Hub — coming-soon landing + waitlist (2026-07-03)
_Rename the home navbar "Agents Hub" item to "Realtor Hub" and repoint it from `/search` to a new professionals coming-soon page (the "Vicinus is coming for real estate professionals" design). Page is a marketing landing with hero, 3 feature cards (Augmented Neighbourhood Data · Neighbourhood Bidding · Short-Form Listing Content), a Founding Member band, and a "Join the Waitlist" form (Full Name · Professional Email · Brokerage · City/Market) that POSTs to a new lead-capture endpoint. Backend mirrors the existing `sell` module / `SellerLead` pattern. Route: `/realtor-hub`. Sizes: S ≤0.5d · M 1–2d._

### Frontend
- [x] **RH-FE-01** [P1] Rename nav item "Agents Hub" → "Realtor Hub" and repoint `href` `/search` → `/realtor-hub` — update both the desktop link and the mobile-menu array entry. `S` · _src/components/landing/HomeNavbar.tsx (lines 51–53 desktop, 109 mobile)_
- [x] **RH-FE-02** [P1] Scaffold `/realtor-hub` route + page shell — new App Router segment rendering the section components below; reuse `HomeNavbar` + footer; server component wrapper, client only where the form needs it. `S` · deps: RH-FE-01 · _src/app/realtor-hub/page.tsx_
- [x] **RH-FE-03** [P1] Hero section — dark-green band, headline "Vicinus is coming for real estate professionals.", subcopy, "Get Early Access" CTA (scrolls to waitlist form), and the product-preview mockup with the "PREDICTIVE HEAT +24% Intent" badge. `M` · deps: RH-FE-02 · _src/components/realtor-hub/RealtorHubHero.tsx_
- [x] **RH-FE-04** [P1] Feature cards section — "Designed for those who curate the market." heading + 3 cards (Augmented Neighbourhood Data · Neighbourhood Bidding · Short-Form Listing Content) with image, title, body; responsive 1→3 column grid. `M` · deps: RH-FE-02 · _src/components/realtor-hub/RealtorHubFeatures.tsx_
- [x] **RH-FE-05** [P2] Founding Member band — dark card "Join as a Founding Member." + copy + "Limited Access" CTA (scrolls to form). `S` · deps: RH-FE-02 · _src/components/realtor-hub/FoundingMemberBand.tsx_
- [x] **RH-FE-06** [P1] Waitlist form (client) — Full Name · Professional Email · Brokerage · City/Market; client-side validation (required + email), submit → RH-FE-07, loading/success/error states, disable-on-submit, honeypot field. `M` · deps: RH-FE-02, RH-FE-07 · _src/components/realtor-hub/WaitlistForm.tsx_
- [x] **RH-FE-07** [P1] API client `submitRealtorWaitlist()` — typed fetch wrapper POSTing to the BE endpoint (RH-BE-02), matching the existing `src/lib/api/*` pattern. `S` · deps: RH-BE-02 · _src/lib/api/waitlist.ts_
- [x] **RH-FE-08** [P2] Responsive + design-token polish — mobile/tablet layout, brand colours (`#1C3829` etc.), 44px tap targets, focus states; screenshot-verify against the design. `S` · deps: RH-FE-03…06 · _src/components/realtor-hub/*_
- [x] **RH-FE-09** [P2] Emit `realtor_waitlist_submitted` analytics event on success — ✅ guarded no-op hook in place (`window.posthog?.capture(...)` in a try/catch); becomes live automatically once DATA-08 mounts posthog. `S` · deps: RH-FE-06, DATA-08 · _src/components/realtor-hub/WaitlistForm.tsx_

### Backend
- [x] **RH-BE-01** [P1] `RealtorWaitlist` Prisma model + migration — fields: `id`, `fullName`, `email`, `brokerage?`, `cityMarket?`, `source?`, `createdAt`; unique index on `email` for dedupe (mirror `SellerLead`). `S` · _api/prisma/schema.prisma_
- [x] **RH-BE-02** [P1] `WaitlistModule` + `POST /waitlist/realtor` — controller + DTO with `class-validator` (`@IsString`, `@IsEmail`, `@MinLength`), Swagger `@ApiTags/@ApiOperation`; wire module into `app.module.ts` (mirror `sell` module). `M` · deps: RH-BE-01 · _api/src/modules/waitlist/*_
- [x] **RH-BE-03** [P1] `WaitlistService.join()` — persist lead, idempotent upsert on `email` (re-submit returns 200 without dup), return `{ ok: true }`; no PII in logs. `S` · deps: RH-BE-02 · _api/src/modules/waitlist/waitlist.service.ts_
- [~] **RH-BE-04** [P2] Spam / abuse protection — ✅ honeypot done (service silently drops when `company` filled). ⏳ Rate limit deferred: `@nestjs/throttler` isn't installed yet — left as a TODO consistent with the existing `main.ts` throttler note; wire on RH-BE-04b / DATA-06. `S` · deps: RH-BE-02 · _api/src/modules/waitlist/*, api/src/app.module.ts_
- [ ] **RH-BE-05** [P2] Server-side `realtor_waitlist_submitted` conversion event + optional ops notification (email/Slack) on new signup — follow the DATA-11 server-event pattern. Deferred: blocked on the (unbuilt) analytics pipeline; a labelled TODO + `logger.log` hook is in place in the service. `S` · deps: RH-BE-03, DATA-07 · _api/src/modules/waitlist/waitlist.service.ts_

## 📊 Data Pipeline — analytics + personalization (2026-07-01)
_Stand up a product-analytics + personalization data pipeline. Full plan: `docs/data-pipeline-plan.md`. **Proposal — nothing built; do not implement until approved.** Recommended stack: PostHog (EU Cloud) as primary product-analytics/dashboard tool + an owned `AnalyticsEvent` Postgres table; server-side capture for conversion events; deterministic rules-based feed ranker in v1. **DATA-01 is a decision gate — several tasks are blocked on it.** Sizes: S ≤0.5d · M 1–2d · L 3–5d._

### Phase 0 — Foundations & Consent
- [x] **DATA-01** [P0] Decide analytics vendor & data-residency — ✅ **DECIDED 2026-07-01: PostHog EU Cloud.** No existing analytics stack; EU region for PIPEDA-defensibility. Budget ceiling + session-replay on/off still TBD. `S` · _decision/infra_
- [ ] **DATA-02** [P1] Consent banner + store (PIPEDA) — accept/reject/manage, first-party cookie, Zustand store; gates all non-essential tracking. `M` · deps: DATA-01 · _src/components/consent/, src/store/_
- [ ] **DATA-03** [P1] Install & init posthog-js behind consent — `opt_out_capturing_by_default`, `identify(clerkId)` on sign-in, mint `anonymous_id`. `M` · deps: DATA-02 · _src/lib/analytics/, src/app/layout.tsx, providers_
- [ ] **DATA-04** [P1] AnalyticsModule + `POST /events` — public endpoint, opportunistic Clerk-token read for `user_id`, DTO validation. `M` · deps: DATA-01 · _api/src/modules/analytics/_
- [ ] **DATA-05** [P1] `AnalyticsEvent` Prisma model + migration — append-only, indexes per plan §7.2. `S` · deps: DATA-04 · _api/prisma/schema.prisma_
- [ ] **DATA-06** [P1] Install & wire `@nestjs/throttler` — tight rate limit on `/events` (closes main.ts TODO). `S` · deps: DATA-04 · _api/src/main.ts, app.module.ts_
- [ ] **DATA-07** [P1] posthog-node in API + `AnalyticsService.track()` — dual-write Postgres + PostHog. `M` · deps: DATA-04, DATA-05 · _api/src/modules/analytics/_

### Phase 1 — Taxonomy & Conversion
- [ ] **DATA-08** [P1] Typed `track()` wrapper + event-name enum — single source of truth for event schema (plan §2). `M` · deps: DATA-03 · _src/lib/analytics/_
- [ ] **DATA-09** [P1] Instrument lifecycle/page/search/feed/property events (client) — full §2 catalog. `L` · deps: DATA-08 · _src/app/**, src/components/feed/*, property/*_
- [ ] **DATA-10** [P1] Onboarding per-step events — started/step/skip/complete/abandon. `M` · deps: DATA-08 · _src/components/onboarding/OnboardingWizard.tsx_
- [ ] **DATA-11** [P1] Server-side conversion events — signed_up, property_saved, search_performed, seller_lead_submitted. `M` · deps: DATA-07 · _api/.../users.service.ts, sell.service.ts, search.service.ts_
- [ ] **DATA-12** [P1] Link `SellerLead` → `User` — nullable `userId` FK + attribute when authed. `S` · deps: DATA-05 · _api/prisma/schema.prisma, sell.*_
- [ ] **DATA-13** [P1] Forward `anonymous_id` on public search — header client→`search_performed`. `S` · deps: DATA-08 · _src/lib/api/*, api/.../search.controller.ts_
- [ ] **DATA-14** [P1] Build Growth / Conversion / Onboarding dashboards — insights + funnels + cohorts in PostHog. `M` · deps: events flowing · _PostHog config_

### Phase 2 — Profile & Personalized Feed
- [ ] **DATA-15** [P1] `UserPreferenceProfile` + `UserPreferredNeighbourhood` models + migration. `M` · deps: Phase 1 · _api/prisma/schema.prisma_
- [ ] **DATA-16** [P1] Dual-write structured profile in `updateOnboarding` — parse budget bands, lifestyle weights. `M` · deps: DATA-15 · _api/.../users.service.ts_
- [ ] **DATA-17** [P2] Backfill script from `onboardingData` blob — one-off, source blob preserved. `S` · deps: DATA-15 · _api script_
- [ ] **DATA-18** [P1] `FeedModule GET /feed` with rules-based ranker — scoring per §7.3, weights via flag/config, anon fallback. `L` · deps: DATA-16 · _api/src/modules/feed/_
- [ ] **DATA-19** [P1] FE feed consumes `/feed` + emits impression/click + `feed_variant` — replace direct searchProperties, reuse IntersectionObserver. `M` · deps: DATA-18 · _src/app/(feed)/feed/page.tsx, src/lib/api/_
- [ ] **DATA-20** [P2] `feed_ranking_v1` flag + A/B on engagement rate. `S` · deps: DATA-19 · _PostHog flag + dashboard_

### Phase 3 — Ops & Scale
- [ ] **DATA-21** [P1] `/health` + `/health/deep` endpoints — Postgres + Redis checks. `S` · _api/src/_
- [ ] **DATA-22** [P2] Sentry APM (errors + perf) + uptime monitor — DDF live-path latency, Web Vitals. `M` · _FE + API + infra_
- [ ] **DATA-23** [P2] `EventIngestLog` + ingestion-lag alerting — mirror DdfSyncLog pattern. `S` · deps: DATA-04 · _api_
- [ ] **DATA-24** [P1] Retention prune cron + erasure hook — 13-mo prune; delete-on-account-deletion (Postgres + PostHog). `M` · deps: DATA-05 · _api @nestjs/schedule_
- [ ] **DATA-25** [P2] (Optional) Metabase companion on Railway — SQL dashboards over AnalyticsEvent. `M` · deps: DATA-05 · _infra_

## 🏘️ Neighbourhoods — 2-level filter redesign (2026-06-29)
_Province → City two-level filter with context-aware pre-selection, adaptive featured section, and mobile scroll. Based on product spec + UI design approved this session._

- [x] **NBR-01** [P1] Replace region pills with 2-level Province → City filter — refactor `NeighbourhoodsClient.tsx` to derive Level 1 province pills and Level 2 city pills from `Neighbourhood.city` data; selecting a province resets city; Level 2 hidden on "All Canada"; Level 2 skipped when province has only 1 city. — _src/components/neighbourhood/NeighbourhoodsClient.tsx, src/lib/neighbourhood-regions.ts_
- [x] **NBR-02** [P1] Default-select BC (most-populated province) on page load — when only one province exists pre-select it; when multiple provinces exist default to "All Canada". — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-03** [P1] Context-aware filter pre-selection from search store — on mount read `searchStore.query` / `searchStore.userCity`; if it matches a known `Neighbourhood.city` auto pre-select province + city pills; fall back to default if unrecognised. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-04** [P1] Adaptive featured section label + content per filter state — "Editor's Picks" (All Canada) · "[Province] Highlights" (province only) · "[City]" (city selected or context-aware); hide section when fewer than 2 neighbourhoods match. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-05** [P2] Hide city/region tag on grid cards when a specific city is selected — tag is redundant when every card is already scoped to that city; show tag on All Canada + province-level views. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-06** [P2] Empty state when selected city has no neighbourhoods — dashed-border box with heading "No neighbourhoods in [City] yet", subtext, and two CTA pills ("Browse all [Province]" + "See nearby cities"); hide grid and featured. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-07** [P2] Sticky filter bar with blur backdrop — `position: sticky; top: 0`; `background: rgba(250,249,246,0.94)`; `backdrop-filter: blur(8px)`; 1px #E8E6E1 bottom border; pills compress to 30px in sticky state. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-08** [P2] Mobile horizontal-scroll pill rows with fade mask — `overflow-x: auto`; no scrollbar; 24px right-edge fade mask; total sticky area ≤88px on mobile; Level 2 animates in with `max-height 0→40px` + `opacity 0→1` at 160ms ease-out. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_

## 🏘️ Neighbourhoods — BC scale-up + search (2026-06-30)
_Scale BC to 382 neighbourhoods across 157 cities. Structure stays **Province → City → Neighbourhood** (regional-district tier explicitly dropped). The city-pill tier must handle 157 cities: collapsed by default (top cities by count), expandable to a full A–Z list. Also seed the full BC dataset so names surface in the `/search/autocomplete` dropdown. Extends NBR-01…08 — do NOT rebuild the sticky bar, featured/spotlight, count badges, context-aware pre-selection, empty states, or mobile scroll/fade already built._

- [x] **NBR-09** [P1] Rewrite `bc-neighbourhoods.ts` seed to load the full CSV (382 neighbourhoods / 157 cities) — replace the hardcoded municipality arrays with a parse of `bc_municipalities_neighbourhoods.csv` (cols: neighbourhood, municipality, type, regional_district). Seed one `Neighbourhood` row per CSV line: `name` = neighbourhood, `city` = municipality, `province` = 'BC'; keep idempotent slug upsert + optional Mapbox geocode. Cities with a single neighbourhood should still produce a browsable row. Confirm the CSV path (currently `~/Downloads/…`) is moved into the repo (e.g. `api/prisma/seeds/data/`) so the seed is reproducible. — _api/prisma/seeds/bc-neighbourhoods.ts, api/prisma/seeds/data/bc_municipalities_neighbourhoods.csv_
- [x] **NBR-10** [P1] Run the BC seed and verify data flows into the index — execute the NBR-09 seed against the dev DB; confirm `getNeighbourhoods()` returns the 382 rows and the index page renders them (no MOCK fallback). Blocker check: seed must run (needs `DATABASE_URL`; Mapbox token optional — coords null is acceptable). — _src/lib/api/neighbourhoods.ts, src/app/(main)/neighbourhoods/page.tsx_
- [x] **NBR-11** [P1] Drop the regional-district (Level 2) tier from `NeighbourhoodsClient.tsx` — remove `districtOptions`/`selectedDistrict`/`showDistrictRow` and the district PillRow so the filter is a clean two-level Province → City per the agreed design. `districtForCity`/`DISTRICT_MUNICIPALITIES` in `neighbourhood-regions.ts` become dead once unused — remove or leave a note. Ripple through `deriveFilters`, `filterNeighbourhoods`, `pickFeatured`, `buildFeaturedLabel`, and the empty-state CTAs. — _src/components/neighbourhood/NeighbourhoodsClient.tsx, src/lib/neighbourhood-regions.ts_
- [x] **NBR-12** [P1] Replace the municipality combobox with a collapsed city-pill tier — swap `MunicipalityCombobox` for a pill row showing top cities ranked by neighbourhood count, gated to cities with **≥2 neighbourhoods** (adjustable threshold — expose as a named const, e.g. `MIN_CITY_PILL_COUNT = 2`, and note it can be tuned). Keep the "All British Columbia" pill (existing all-cities pill) and reuse the existing `Pill`, `PillRow`, count badges, sticky compaction, and mobile fade mask. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-13** [P1] Add "Show all 157 ›" expand / "Collapse" behaviour for the city tier — a trailing affordance after the collapsed pills reveals the full **alphabetical (A–Z)** list of every city as pills; a "Collapse" control returns to the NBR-12 default. No search box (explicitly decided against). Manage expanded/collapsed via local state; count in the label should reflect the actual city total. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [ ] **NBR-14** [P2] Optional: A–Z section headings in the expanded city list — group the full expanded pill list under letter headers (A, B, C…) for scannability. Sub-task of NBR-13; skip if it complicates the mobile horizontal-scroll row. — _src/components/neighbourhood/NeighbourhoodsClient.tsx_
- [x] **NBR-15** [P1] Verify BC city + neighbourhood names surface in the search dropdown — after NBR-10, confirm `/search/autocomplete` returns both cities (rows where `name === city`) and sub-area neighbourhoods (rows where `name !== city`) for BC queries, and that `SearchBar` + `HeroSearchBar` render them (city vs neighbourhood icon/type). No FE or BE-endpoint change expected — the endpoint is already DB-driven and partitions city vs neighbourhood; this is verification of the NBR-09/10 seed. — _api/src/modules/search/search.service.ts (read-only verify), src/components/search/SearchBar.tsx, src/components/landing/HeroSearchBar.tsx_

## 🛠️ Backend — new endpoints (2026-06-19)
_New BE work to replace mock/static data (see mock-data audit). "Wiring-only" items excluded — those have endpoints already._

- [x] **BE-A** [P1] `GET /search/autocomplete?q=` — cities (static CANADIAN_CITIES) + neighbourhoods (seeded `Neighbourhood` table via Prisma), prefix-ranked, deduped (drops municipality rows that duplicate a city), Redis-cached. FE `SearchBar` + `HeroSearchBar` now call it (debounced, race-safe) instead of `MOCK_AUTOCOMPLETE`. — _api/src/modules/search/search.service.ts, src/components/search/SearchBar.tsx, src/components/landing/HeroSearchBar.tsx_
- [ ] **BE-B** [P1] `GET /users/me/notifications` — alerts (saved-search price drops) + schedule (saved listings' open houses). Replaces dashboard IntelligencePanel/NotificationsPanel mocks. Scope to alerts+schedule; drop fake "Sarah" message until real messaging exists.
- [ ] **BE-C** [P2] `POST/DELETE /properties/:id/like` + like count in feed payload. New `PropertyLike` model. Replaces `Math.random()` like count. (Or defer + remove metric.)
- [ ] **BE-D** [P1] `POST /sell/valuation` ✅ built — needs e2e test + real DDF comps instead of Gemini-fabricated.
- [ ] **BE-E** [P2] Populate `Neighbourhood.walkScore/transitScore` (replaces `?? 80 / ?? 8`).
- [ ] **BE-F** [P2] Add `Neighbourhood.flavors` field + seed (replaces hardcoded `NeighbourhoodFlavors`).
- [x] **BE-G** [P1] Real market context wired to property detail. BE `getMarketContext` now resolves subject by `ddfListingKey` (was UUID-only → why it was never wired); returns median price/$ per sqft/DOM, price position, demand from live active comps. FE detail page fetches it server-side; `MarketContext` shows real area medians + "Price Position" (dropped the impossible YoY +8.4% — DDF has no historical/sold data) and the fabricated $1,290/18d subs. Verified via SSR HTML. — _api/.../properties.service.ts, src/lib/api/properties.ts, src/components/property/MarketContext.tsx, properties/[id]/page.tsx_
- [x] **BE-H** [P2] `GET /properties/featured` — curator picks if flagged, else top-priced active BC residential (beds≥3, sqft>1000, has photos). Landing page "Curated Highlights" now shows real DDF listings (Whistler/White Rock/Vancouver) instead of fabricated US homes (Palm Springs/Aspen/Chelsea). Section hides when empty. Verified via live HTML. — _api/.../properties.{controller,service}.ts, src/lib/api/properties.ts, src/app/page.tsx_

## 🏷️ Sell Flow — new feature (2026-06-18)
_Navbar "Sell" link already points to `/sell` (route doesn't exist yet → 404). Build the seller lead-gen flow there. Unauthenticated lead-capture; reuse existing Vicinus design tokens (#1C3829 / #A3E635 / #FAF9F6), NOT the mockup's "EstateIntelligence"/"The Curator" branding. **Decision: persist lead to BE; valuation generated by Gemini** (reuse AiModule's `@google/generative-ai` pattern + `GEMINI_API_KEY`)._

- [ ] **SELL-01** [P1] Intro screen at `/sell` — hero "What is your property worth?" with address input + "Explore Value" CTA. Address carries into the question flow. — _New: `src/app/sell/page.tsx`, `src/components/sell/SellIntro.tsx`_
- [ ] **SELL-02** [P1] 3-question flow (Step 1/3 selling priority · Step 2/3 biggest hurdle · Step 3/3 advisory preference + name/email/phone lead form), progress bar, back/next, answers threaded across steps. — _New: `src/components/sell/SellWizard.tsx`_
- [ ] **SELL-03** [P1] BE: `SellerLead` Prisma model + migration; `SellModule` (`POST /sell/valuation`) persists the lead and returns a Gemini-generated valuation (value range, confidence, market pulse, comparables). — _New: `api/prisma/schema.prisma`, `api/src/modules/sell/*`, `api/src/app.module.ts`_
- [ ] **SELL-04** [P1] Valuation detail screen — address as title, Gemini value range, confidence, AI market pulse, comparable-sales cards, "Schedule Walkthrough" CTA. — _New: `src/components/sell/SellValuation.tsx`, `src/lib/api/sell.ts`_
- [ ] **SELL-05** [P2] Wire transitions: intro → wizard → valuation as one state-driven client flow (loading state while Gemini generates). — _Files: `src/app/sell/page.tsx`_

## ✅ Completed this session (2026-06-14)
- [x] **FIX-01** [P0] Home hero search now hydrates the search page from URL params (`q`, `priceRange`, etc.). — _Files: `src/app/(main)/search/page.tsx`, `SearchPageClient.tsx`, `src/components/search/SearchBar.tsx`_
- [x] **FIX-02** [P0] Saved/visited properties end-to-end: Clerk token attached to API client (`src/lib/api/client.ts`); `SavedProperty`/`VisitedProperty` now store the DDF ListingKey instead of a Property FK (migration `20260614210251_saved_visited_store_listing_key`); dashboard resolves cards from the local Property table with a live DDF fallback and returns shapes matching the FE types. — _Files: `api/src/modules/users/users.service.ts`_
- [x] **FIX-03** [P1] Search `listingType` (For Sale/For Rent) wired FE→BE; advanced filters with no DDF backing labeled "coming soon". — _Files: `api/.../search-query.dto.ts`, `ddf-query.service.ts`, `SearchPageClient.tsx`, `src/components/search/FilterPanel.tsx`_

## 🔧 Backlog — QA Audit (2026-06-14)
_Enumerated findings: 2 P0 · 14 P1 · 11 P2 = 27. (Audit header stated "3 P0, 14 P1, 12 P2"; only 27 distinct findings were listed.)_

### Landing
- [ ] **QA-01** [P1] Hardcoded US "Curated Highlights" on homepage — _src/app/page.tsx:18-55,284_ — static US luxury homes rendered on a Canadian platform, hrefs to mock /properties/1,2,3.
- [ ] **QA-02** [P1] `Math.random()` for user-facing "Active Editorials" count — _src/app/page.tsx:132-133_ — fabricated number, hydration mismatch risk.
- [ ] **QA-03** [P2] Hero search does not pass listing type — _src/app/page.tsx:172-204_ — no For Sale/Rent selector from homepage.

### Search
- [ ] **QA-04** [P1] Autocomplete is mock-only; API client method dead — _src/components/search/SearchBar.tsx:6,36-50, src/lib/api/search.ts:45-46_ — filters MOCK_AUTOCOMPLETE (SF data); /search/autocomplete endpoint does not exist in BE.
- [ ] **QA-05** [P1] Saved searches never persist to backend — _src/components/search/SaveSearch.tsx:15-22, src/store/searchStore.ts:100-114_ — store-only; saveSearch/getSavedSearches API + /users/me/searches endpoints exist but never called; vanish on refresh, email alerts never fire.
- [ ] **QA-06** [P2] FE→BE saved-search body shape mismatch — _src/lib/api/search.ts:32-37 vs api/src/modules/search/dto/create-saved-search.dto.ts:4-18_ — FE sends name/query/filters/mapBounds; DTO only accepts name+filters; query/mapBounds dropped.
- [ ] **QA-07** [P2] city/province search params defined but never sent — _src/app/(main)/search/SearchPageClient.tsx:89-108, src/lib/api/search.ts:4-24_ — structured city filtering unreachable from UI.
- [ ] **QA-08** [P2] Advanced filters UI-only (known) — _src/components/search/FilterPanel.tsx:345-534_ — basement/stories/days-on-market/open-house/coming-soon/financial/rental controls not sent to API.

### Property Detail
- [ ] **QA-09** [P0] Mock fallback serves San Francisco/USD data as a real listing — _src/app/(main)/properties/[id]/page.tsx:31,61, src/types/property.ts:170-300_ — getMockPropertyDetail returns SF properties for null/unknown ids; users shown fabricated American listings + fake history.
- [ ] **QA-10** [P1] "Send Message"/"Contact Agent" no handler or fallback — _src/components/property/AgentCard.tsx:48-51, src/components/property/ActionBar.tsx:177-183_ — Send Message has no onClick; Contact Agent uses tel:${agentPhone} but agentPhone never populated for live DDF (src/lib/api/properties.ts:64-98), falls back to href="#".
- [ ] **QA-11** [P1] MarketContext renders hardcoded comparables + fabricated YoY — _src/components/property/MarketContext.tsx:11-12,28,34,52_ — priceChange ?? 8.4, "avg 18d", "$1,290" hardcoded; BE /properties/:id/market-context never called.
- [ ] **QA-12** [P1] NeighbourhoodContextScore hardcoded Walk/Lifestyle scores — _src/components/property/NeighbourhoodContextScore.tsx:23-25,33_ — walkScore ?? 80, lifestyleScore ?? 8; same fabricated scores on every live property; "View full profile" href="#".
- [ ] **QA-13** [P2] Mortgage CTAs non-functional — _src/components/property/MortgageAnalysis.tsx:147-152_ — "Get Pre-Approved"/"Connect with Agent" no handlers.

### Dashboard / Saved
- [ ] **QA-14** [P1] Saved-property state never hydrates; save heart wrong on load — _src/store/userStore.ts:6,17, src/components/property/ActionBar.tsx:101-106_ — setSaved has no callers; savedPropertyIds empty on load; heart shows "Save" for already-saved.
- [ ] **QA-15** [P1] IntelligencePanel entirely hardcoded mock — _src/components/dashboard/IntelligencePanel.tsx:11-73,108-112_ — fixed open house, fake message from "Sarah", fake price drop, hardcoded "5" badge; tabs inert.
- [ ] **QA-16** [P1] RecentSearches hardcoded US searches, no handlers — _src/components/dashboard/RecentSearches.tsx:1-7 via WelcomeBanner.tsx:23_ — Chelsea/Aspen/Malibu/Whistler chips, no onClick.
- [ ] **QA-17** [P1] VisitedProperties fabricates status tags/metadata — _src/components/dashboard/VisitedProperties.tsx:28-29,36,69-71,90-97_ — index%2 "OFFER PENDING"/"FAVORITE"; SHORTLIST/DOCS/OFFER buttons no handlers.
- [ ] **QA-18** [P1] "Schedule Tour"/"Add to Calendar" CTAs dead — _src/components/dashboard/SavedProperties.tsx:79-83, src/components/dashboard/FeaturedProperty.tsx:62-66_ — no handlers; FeaturedProperty hardcodes "Next Open House Oct 12".
- [ ] **QA-19** [P2] EditorialCurations tab toggle inert; cards not clickable — _src/components/dashboard/EditorialCurations.tsx:84-85,101-115,119-123_ — both tabs identical; cards have no link despite BE ctaUrl.
- [ ] **QA-20** [P2] Dead mock arrays shipped — _src/components/dashboard/VecinusPanel.tsx:43-56 (unused), EditorialCurations.tsx:9-42 (MOCK_CURATIONS fallback)_.

### Neighbourhoods
- [ ] **QA-21** [P1] Neighbourhood data silently falls back to Rosedale/US mock — _src/lib/api/neighbourhoods.ts:17-64,68-73,137-158_ — MOCK_* datasets on empty API; getNeighbourhood merges Rosedale mock into every slug.
- [ ] **QA-22** [P2] Neighbourhood agents email:null but UI implies email contact — _api/src/modules/neighbourhoods/neighbourhoods.service.ts:160-171,227_.

### AI
- [ ] **QA-23** [P0] AI summary feature fully orphaned — _api/src/modules/ai/ai.controller.ts:12-26, ai.service.ts:55-75; no FE caller_ — /ai/property-summary/:id endpoints exist but nothing calls them; AiService queries local Property by UUID while live pages use DDF ListingKey, so id types are incompatible.
- [ ] **QA-24** [P1] AI module throws at boot if GEMINI_API_KEY unset — _api/src/modules/ai/ai.service.ts:52_ — getOrThrow in constructor crashes whole API; AiModule always registered. (Currently mitigated by a placeholder key in api/.env added this session.)

### Backend / Infra
- [ ] **QA-25** [P2] Saved/visited resolution N+1 to external DDF — _api/src/modules/users/users.service.ts:140-147_ — one DDF round-trip per unsynced key, uncached.
- [ ] **QA-26** [P2] trackVisited POSTs unauthenticated on every property view — _src/hooks/useTrackVisited.ts:8-13_ — fires for signed-out users → guaranteed 401.

### Other
- [ ] **QA-27** [P2] getProperty/getProperties API clients point at unused/partial routes — _src/lib/api/properties.ts:4-5_ — dead clients hitting UUID path that doesn't match live ListingKeys.

## 📦 Previous Sprints (completed)

### Frontend (FE)
- [x] **FE-2** — Tabbed Facts & features panel
- [x] **FE-307** — Map price pins skip null coords
- [x] **FE-401** — Property detail page
- [x] **FE-402** — Property gallery (hero + thumbs)
- [x] **FE-403** — Property stats bar
- [x] **FE-404** — Neighbourhood context score
- [x] **FE-405** — Mortgage analysis calculator
- [x] **FE-406** — Nearby open houses carousel
- [x] **FE-407** — Market context panel
- [x] **FE-408** — Assessment history table
- [x] **FE-409** — Sales history table
- [x] **FE-410** — Listing activity map
- [x] **FE-411** — Action bar (save/share/contact)
- [x] **FE-412** — Track visited on page load
- [x] **FE-501** — Neighbourhood detail page
- [x] **FE-601** — Dashboard page (protected)

### Backend (BE)
- [x] **BE-303** — Algolia sync on DDF upsert
- [x] **BE-305** — Global Redis search cache
- [x] **BE-306** — Saved searches API
- [x] **BE-401** — Property detail endpoint
- [x] **BE-402** — Nearby open houses endpoint
- [x] **BE-403** — Market context endpoint
- [x] **BE-404** — Assessment history endpoint
- [x] **BE-405** — Sales history endpoint
- [x] **BE-406** — Similar properties endpoint
- [x] **BE-408** — Cached property detail service
- [x] **BE-501** — Neighbourhood detail service
- [x] **BE-502** — Neighbourhood listings
- [x] **BE-503** — Neighbourhood stats
- [x] **BE-504** — Neighbourhood market data
- [x] **BE-505** — Neighbourhood agents
- [x] **BE-601** — Saved properties API
- [x] **BE-602** — Visited properties API
- [x] **BE-604** — User dashboard aggregate

## Summary
- **Backlog (QA Audit):** 27 tasks — 2 P0 · 14 P1 · 11 P2
- **Completed this session:** 3 (FIX-01..FIX-03)
- **Previous-sprint tickets shipped:** 33 (16 FE · 17 BE)
