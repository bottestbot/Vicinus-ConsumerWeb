# Vicinus — Data Pipeline for Product Analytics & Personalization

**Implementation Plan & Task Breakdown (v1)**

Author: Planning Engineer (PE agent) · Date: 2026-07-01 · Status: **proposal — nothing built yet, awaiting approval**

---

## 0. Grounding — what the code actually looks like today

Verified against the repo so the recommendations fit reality:

- **No analytics anything.** `grep` for `posthog|mixpanel|amplitude|segment|analytics|gtag` returns zero hits across `src/`, `api/src/`, and both `package.json` files. No events table in `api/prisma/schema.prisma`, no SDK installed. Greenfield.
- **Frontend → API path.** All calls go through one axios instance (`src/lib/api/client.ts`) with `baseURL = NEXT_PUBLIC_API_BASE_URL`. A request interceptor attaches the Clerk bearer token from `window.Clerk.session.getToken()`. Client events can be authenticated the same way with zero new auth plumbing.
- **Auth model.** `ClerkAuthGuard` (`api/src/common/guards/clerk-auth.guard.ts`) calls `verifyToken` and sets `request.userId = payload.sub` (the Clerk user id / `clerkId`). `@CurrentUser()` yields that `clerkId`. The `User` table mirrors `clerkId` (unique). This is the identity spine for event stitching.
- **Onboarding today.** `OnboardingWizard.tsx` collects `goal, timeline, neighbourhoods[], openToNearby, lifestylePriorities[], homeType, budget, bedrooms, mortgage, workingWithRealtor` and PATCHes them as one blob via `updateOnboarding` → `users.service.updateOnboarding` merges into `User.onboardingData` (Json). `OnboardingGate.tsx` fires `POST /users/me/ping` once per load (increments `loginCount`, returns `showOnboarding`). No per-step tracking — single merged blob on "Save & Exit"/complete.
- **Feed today.** `src/app/(feed)/feed/page.tsx` is a client component. It calls the **public** `searchProperties` (DDF passthrough via `GET /search`), maps listings, does a trivial client-side sort (video listings first). **No ranking, no personalization, no impression/click tracking.** Active card already tracked via `IntersectionObserver` (`activeIndex`) — a natural hook for impression events.
- **Behaviour tables exist.** `SavedProperty`, `VisitedProperty`, `SavedSearch` — but these are *current-state* tables (upsert/dedupe), not an event log. `VisitedProperty.trackVisited` deletes + recreates to dedupe, destroying history. Good for "recently viewed", useless for time-series analytics.
- **Search & sell are anonymous.** `GET /search` has **no** `ClerkAuthGuard` (public). `POST /sell/valuation` writes a `SellerLead` with **no `userId` link**. Seller leads and searches currently can't be attributed to a user.
- **Ops primitive already exists.** `DdfSyncLog` (entity, syncedAt, recordsSynced, status, errorMessage) is exactly the shape we want for ingestion health — reuse the pattern. Bulk sync **crons are disabled** (search hits DDF live on demand), so "DDF freshness" matters less than **DDF API latency/error rate** on the live path.
- **Infra.** NestJS 11 + Prisma 7 + Postgres (`@prisma/adapter-pg`) + Redis (`ioredis`, `RedisService` is `@Global`, degrades gracefully) on **Railway**. `@nestjs/schedule` present. FE is Next 16.2 App Router on **Netlify**. Middleware at `src/proxy.ts` (Next 16 convention) runs `clerkMiddleware()` on the Node runtime.
- **Prod hardening deferred.** `main.ts` has TODOs for `helmet` and `@nestjs/throttler` (not installed). Rate limiting matters for a public ingest endpoint.

---

## 1. Objectives & Scope

### What "data pipeline" means here
Three coupled capabilities:
1. **Capture** — a durable, structured record of what users and the system do (events), from both the Next.js client and the NestJS server.
2. **Analyze** — business + operational dashboards answering "are we growing, are people engaging, is the system healthy."
3. **Activate** — turn onboarding inputs + behavioural signals into a **user preference profile** that drives a **personalized feed ranking**.

### In scope for v1
- A single **product-analytics tool** capturing client + server events.
- A defined **event taxonomy** and a typed `track()` wrapper (one place, consistent schema).
- **Anonymous → identified stitching** via Clerk.
- **Consent gating** (PIPEDA-compliant banner; no non-essential tracking before consent).
- **Structured onboarding profile** (new Prisma models, promoted out of the Json blob) + a **deterministic rules-based feed ranker**.
- **Business + operational dashboards** in the chosen tool.
- Backfilling attribution gaps: link `SellerLead` to `User`; add an authenticated **event log table** so we own the raw data regardless of vendor.

### Out of scope for v1 (path noted for later)
- ML / learned ranking (embeddings, collaborative filtering). v1 ranker is rules + weights.
- Separate columnar warehouse (BigQuery/Snowflake/ClickHouse) + dbt. Postgres + the analytics tool is enough at current scale; ClickHouse is the documented Phase 3 escape hatch.
- Real-time streaming (Kafka/Kinesis). Batched HTTP is sufficient.
- Multi-touch attribution, marketing-mix modeling, email/CASL messaging automation (only the *consent plumbing* lands in v1).
- A/B testing framework (the chosen tool gives us flags/experiments later at near-zero cost).

---

## 2. Event Taxonomy / Tracking Plan

### 2.1 Naming & schema conventions
- **Event names:** `object_action`, snake_case, past tense. E.g. `property_saved`, `feed_card_clicked`, `onboarding_step_completed`.
- **Property keys:** snake_case. Reserved keys never reused: `distinct_id`, `anonymous_id`, `user_id` (= clerkId), `session_id`, `timestamp`, `source` (`web` | `api`), `$current_url`, `listing_key` (DDF ListingKey — the canonical property id everywhere).
- **One event, one meaning.** `property_viewed` (detail page) ≠ `feed_card_impression` (card scrolled into view).
- **Identity:**
  - `anonymous_id` — a UUID minted client-side, stored in a first-party cookie/localStorage, sent on every event pre-auth.
  - `user_id` — the Clerk `clerkId` once signed in.
  - On sign-in, call the tool's `identify(clerkId)` + alias the `anonymous_id`. With PostHog, `posthog.identify(clerkId)` performs the alias automatically.
- **Server events** set `user_id` directly (guard resolves `clerkId`), mark `source: "api"`. Server events for anonymous flows (public search) carry the `anonymous_id` forwarded from the client in a header.

### 2.2 Event catalog (v1)

**Lifecycle / identity**
| Event | Trigger | Key properties |
|---|---|---|
| `session_started` | first event of a session | `referrer`, `utm_*`, `device`, `entry_path` |
| `page_viewed` | route change (App Router) | `path`, `route_group` |
| `signed_up` | Clerk sign-up complete | `method`, `role` (buyer/seller) |
| `signed_in` | Clerk session created | `method` |
| `user_identified` | on identify | `login_count` |

**Onboarding** (currently invisible to analytics — high value)
| Event | Trigger | Key properties |
|---|---|---|
| `onboarding_started` | wizard mount | `entry_point` |
| `onboarding_step_viewed` | each step render | `step_number`, `step_name` |
| `onboarding_step_completed` | Next pressed | `step_number`, `step_name`, `selections` |
| `onboarding_step_skipped` | Skip pressed | `step_number` |
| `onboarding_completed` | finish | `duration_ms`, `steps_completed`, profile summary |
| `onboarding_abandoned` | Save&Exit before finish | `last_step` |

**Search & discovery**
| Event | Trigger | Key properties |
|---|---|---|
| `search_performed` | `GET /search` submit | `query`, `city`, `filters`, `result_count`, `source` |
| `filter_applied` | filter change | `filter_name`, `filter_value` |
| `autocomplete_selected` | pick a suggestion | `query`, `selection` |
| `map_moved` | viewport change (debounced) | `bbox`, `zoom` |

**Feed & property**
| Event | Trigger | Key properties |
|---|---|---|
| `feed_card_impression` | card ≥60% visible (existing IntersectionObserver) | `listing_key`, `position`, `feed_variant` |
| `feed_card_clicked` | tap/expand a card | `listing_key`, `position` |
| `property_viewed` | detail page open | `listing_key`, `price`, `city`, `beds`, `source` |
| `property_saved` / `property_unsaved` | save toggle | `listing_key`, `surface` |
| `property_media_viewed` | open gallery/video/tour | `listing_key`, `media_type` |
| `saved_search_created` / `_deleted` | saved-search actions | `filters` |

**Conversion / lead-gen (the money events)**
| Event | Trigger | Key properties |
|---|---|---|
| `agent_contact_clicked` | contact CTA | `listing_key`, `agent_key`, `channel` |
| `sell_flow_started` | sell landing/CTA | `entry_point` |
| `sell_step_completed` | each sell step | `step_name` |
| `seller_lead_submitted` | `POST /sell/valuation` succeeds | `selling_priority`, `has_contact_info`, `user_id?` |
| `valuation_viewed` | AI valuation shown | `address_city` (no full PII) |
| `realtor_connect_requested` | "connect me with a realtor" | `context` |

Free-form user text (search query strings, addresses) must be **minimized/hashed** before leaving the browser where it could be PII — see §8.

---

## 3. Pipeline Architecture

### 3.1 Recommended architecture (v1)

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Next.js client (Netlify)   │        │  NestJS API (Railway)        │
│                             │        │                              │
│  lib/analytics/track.ts  ───┼──(a)──▶│  AnalyticsModule             │
│   • posthog-js (batched,    │        │   POST /events (public,      │
│     sendBeacon on unload)   │        │     throttled, consent-aware)│
│   • anonymous_id cookie     │        │   • Zod-validate payload     │
│   • identify(clerkId)       │        │   • enrich w/ user_id (guard │
│                             │        │     if token present)        │
│                             │  (b)   │   • write AnalyticsEvent row │
│  Server Components / route ─┼───────▶│   • forward to PostHog        │
└─────────────────────────────┘        │     capture API (server key) │
                                       │   • Redis buffer (optional)  │
                    (c) direct         │  Existing services emit      │
     posthog-js ─────────────────────▶ │  server-side events inline:  │
     PostHog Cloud (product analytics) │   AnalyticsService.track()   │
                                       └──────────────┬───────────────┘
                                                      │
                        ┌─────────────────────────────┴───────────────┐
                        │  PostHog (dashboards, funnels, cohorts,      │
                        │  retention, session insights, flags)         │
                        │  + Postgres AnalyticsEvent (raw, owned) ─────┼──▶ Metabase (optional)
                        └───────────────────────────────────────────────┘
```

**Two capture paths, one taxonomy:**
- **(a/c) Client-side** via `posthog-js` for high-volume UI events (page views, impressions, clicks, funnels, optional session replay). PostHog batches automatically and uses `navigator.sendBeacon` on unload — critical so last-interaction events aren't lost.
- **(b) Server-side** for **trustworthy conversion events** that must not depend on the client (ad-blockers, tab-close races): `seller_lead_submitted`, `property_saved`, `signed_up`, `search_performed`. These fire from inside existing NestJS services via a thin `AnalyticsService.track()` that (1) writes an `AnalyticsEvent` row and (2) forwards to PostHog's server capture endpoint.

**Why also a Postgres `AnalyticsEvent` table?** Ownership + join-ability + no vendor lock-in. Lets us (i) build the feed ranker on our own data with a normal Prisma query, (ii) reconstruct dashboards if we leave the vendor, (iii) join events to `User`/`Property`. Cheap insurance. Keep it lean.

### 3.2 Transport & buffering
- **Client transport:** let `posthog-js` handle batching + `sendBeacon`. For our `POST /events` mirror, batch (flush every ~5s / 20 events, plus `sendBeacon` on `visibilitychange=hidden`).
- **Collection endpoint:** new **`AnalyticsModule`** (`api/src/modules/analytics/`) exposing `POST /events`. **Public** (no guard) so anonymous events land, but **opportunistically reads the bearer token** to attach `user_id` when present. Must be **rate-limited** (`@nestjs/throttler` — addresses the `main.ts` TODO).
- **Buffering:** direct Postgres `createMany` is fine at current scale. Add **Redis write buffer** only if volume demands it (push to a Redis list, drain with a `@nestjs/schedule` cron). **Not in v1.**
- **Durable storage:** Postgres `AnalyticsEvent` (append-only) + PostHog Cloud.

### 3.3 Trade-offs
- **Pro:** minimal new infra, reuses Clerk auth + Prisma + Redis patterns; server-side path guarantees conversion accuracy; owning raw events de-risks lock-in; PostHog gives funnels/retention/replay in ~1 day.
- **Con:** dual-write (Postgres + PostHog) = more code + a consistency gap (acceptable — PostHog is source of truth for dashboards, Postgres for the ranker).
- **Rejected — Postgres-only + Metabase (no vendor):** cheapest, fully resident, but every funnel/retention/cohort is hand-built SQL and session analysis is painful. Keep Metabase as an *optional companion*, not primary.
- **Rejected — Segment CDP:** solves multi-destination routing we don't have yet. Add later if needed.

---

## 4. Build vs Buy — Dashboards & Analytics Tooling

### Recommendation: **PostHog (Cloud, EU region) as primary product-analytics + dashboard tool for v1.** Add **Metabase** later as an optional SQL-dashboard companion on the existing Postgres.

**Why PostHog:**
- One tool covers events, **funnels, retention, cohorts, trends, dashboards, feature flags, session replay** — matching every business metric in §5 with no query-writing.
- **First-class Next.js + Node SDKs** (`posthog-js`, `posthog-node`) that slot into the axios/Clerk pattern here. `identify(clerkId)` handles stitching natively.
- **Self-host path exists** (Docker) if residency hardens — same product, no rewrite. Start on Cloud to avoid ops burden.
- **Generous free tier** (~1M events/month), predictable usage pricing after.
- Feature flags let us run the personalized-feed experiment (`feed_variant`) for free.

**Data residency / PIPEDA:** choose PostHog **EU Cloud** (GDPR-grade) over US Cloud — Canadian PIPEDA reviewers are far more comfortable with EU than US processing. If legal insists on **Canadian residency**, self-host on Railway/Canadian VPS — plan unchanged, only the deployment target. **Open question (§11).**

**Alternatives (opinionated):**
- **Mixpanel / Amplitude** — excellent, but analytics-only (no flags/replay/cheap self-host), US-centric residency, still need a CDP for server events. PostHog is the better single-vendor bet.
- **GA4** — free, fine for marketing top-of-funnel, but weak for product funnels/cohorts, painful for logged-in personalization signals, PIPEDA-awkward. Optionally add later purely for SEO/acquisition — not the backbone.
- **DIY events table + Metabase/Grafana/Superset** — full control + residency, zero vendor cost, but every analysis is hand-written SQL and there's no session/replay. Too slow to value. We already get "owned data" from the Postgres table, so add Metabase *when* someone wants ad-hoc SQL — not as primary.

### How & where dashboards get created (PostHog path)
1. Create a PostHog EU Cloud project → project API key (client) + server API key (server).
2. Events flow from `posthog-js` (client) + `posthog-node` (server) + our `/events` mirror.
3. In PostHog UI build **Insights** (Trends, Funnels, Retention, Paths) from the §2 taxonomy, pin to **Dashboards**:
   - **Growth** — signups, activation funnel, DAU/WAU/MAU, stickiness.
   - **Engagement** — feed engagement rate, saves/user, sessions, search volume.
   - **Conversion** — visitor→signup→onboarding→save→lead funnels, lead counts.
   - **Onboarding** — step completion/drop-off, time-to-complete.
4. **Cohorts** defined once ("activated buyers", "sellers"), reused across insights.
5. **Metabase (optional):** point at Railway Postgres, build SQL Questions on `AnalyticsEvent` joined to `User`/`Property`, group into dashboards. Deploy as its own Railway service.

---

## 5. Business Metrics (precise definitions)

Window defaults to rolling 28-day unless stated. "Active" = fired any tracked event.

**North-star (recommendation): Weekly Engaged Users who saved ≥1 property.**
Distinct `user_id` with ≥1 `property_saved` (or `agent_contact_clicked`) in the trailing 7 days. A save is the clearest signal of genuine intent and predicts lead conversion; user-scoped, weekly, moves with real value (not vanity pageviews).

### Acquisition & activation
- **Signups** = count(`signed_up`) per period.
- **Signup conversion rate** = distinct users with `signed_up` ÷ distinct `anonymous_id` with `session_started`, same window.
- **Activation rate** = new users who reach "aha" (`onboarding_completed` AND ≥1 `property_saved` within 7 days of signup) ÷ new signups in cohort.

### Engagement
- **DAU / WAU / MAU** = distinct `user_id` active in 1 / 7 / 28 days.
- **Stickiness (DAU/MAU)** = DAU ÷ MAU (target ~20%+).
- **Sessions per user** = count(`session_started`) ÷ distinct active users.
- **Feed engagement rate** = count(`feed_card_clicked`) ÷ count(`feed_card_impression`), by `feed_variant` (the metric the ranker must move).
- **Saves per active user** = count(`property_saved`) ÷ distinct active users.

### Retention & cohorts
- **W1/W4 retention** = % of a signup-week cohort active in week 1 / 4 after signup.
- **Onboarding cohort curves** = retention split by `goal` (buy/sell/rent/exploring).

### Conversion funnels
- **Primary:** `session_started` → `signed_up` → `onboarding_completed` → `property_saved` → `agent_contact_clicked`.
- **Sell:** `sell_flow_started` → `sell_step_completed` (each) → `seller_lead_submitted`.

### Lead-gen (revenue-adjacent)
- **Buyer leads** = count(`agent_contact_clicked` + `realtor_connect_requested`), distinct users.
- **Seller/valuation leads** = count(`seller_lead_submitted`) (server-tracked = trustworthy).
- **Lead conversion rate** = leads ÷ activated users.
- **Cost per lead** (once spend is wired) = spend ÷ leads.

---

## 6. Operational Metrics

Split by tool: **PostHog** for product signals; **APM/monitoring** for system health. For a small team: **Railway metrics + Sentry (errors + performance)**, or Grafana Cloud/Better Stack for uptime. Don't overload PostHog with infra metrics.

| Metric | Definition | Where |
|---|---|---|
| **DDF live-path latency & error rate** | p50/p95 latency + 5xx rate of `GET /search`, `/search/map-pins`, DDF passthrough | APM (Sentry perf) |
| **DDF freshness (if crons re-enabled)** | now − max(`DdfSyncLog.lastModifiedTimestamp` where status='success') per entity | `DdfSyncLog` → Metabase |
| **Sync job success rate** | success ÷ total `DdfSyncLog` rows per entity/day | `DdfSyncLog` → Metabase |
| **Event ingestion lag / loss** | rows/min into `AnalyticsEvent`; client-batches sent vs `/events` 2xx; alert on drop-to-zero | `EventIngestLog` + PostHog volume |
| **API uptime & latency** | health-check success %, p95 per route | Railway + uptime monitor |
| **DB / Redis health** | Postgres connections/CPU; Redis connected flag (already `RedisService.connected`) | Railway + `/health` |
| **Feed render performance** | Web Vitals (LCP/INP) on `(feed)` route | PostHog web vitals / Sentry |
| **Cron success** | `@nestjs/schedule` job outcomes | App logs + DdfSyncLog-style table |

Add `GET /health` (+ `/health/deep` pinging Postgres + Redis) — small, high-value, feeds the uptime monitor.

---

## 7. Onboarding Capture → Personalization

### 7.1 Problem with today's model
`User.onboardingData` is an opaque merged **Json blob** written once. Not queryable (can't segment "users who want schools + transit in Kitsilano"), not versioned, not join-friendly for ranking. Promote it to structured columns/tables while keeping the blob as a raw fallback.

### 7.2 Proposed data model changes (proposal only)

```prisma
model UserPreferenceProfile {          // one row per user — the queryable profile
  id                 String   @id @default(uuid())
  userId             String   @unique
  goal               String?              // buy | sell | rent | exploring
  timeline           String?
  openToNearby       Boolean  @default(false)
  homeType           String?
  budgetMin          Int?                 // parse the budget band into numbers
  budgetMax          Int?
  bedroomsMin        Int?
  mortgageStatus     String?
  workingWithRealtor String?
  lifestyleWeights   Json?                // { schools: 0.8, transit: 0.6, ... } normalized
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id])
}

model UserPreferredNeighbourhood {      // many-to-many, rank by geography
  id              String @id @default(uuid())
  userId          String
  neighbourhoodId String?               // FK when it maps to a known Neighbourhood
  rawName         String                // free-text fallback
  weight          Float  @default(1.0)
  @@unique([userId, neighbourhoodId])
}

model AnalyticsEvent {                  // owned raw event log (append-only)
  id           String   @id @default(uuid())
  eventName    String
  userId       String?                  // clerkId-linked User.id when identified
  anonymousId  String?
  sessionId    String?
  source       String                   // web | api
  properties   Json                     // event-specific props
  listingKey   String?                  // denormalized hot key for the ranker
  occurredAt   DateTime                 // client timestamp
  receivedAt   DateTime @default(now())
  @@index([userId, eventName, occurredAt])
  @@index([eventName, occurredAt])
}
```

Migration/backfill: a one-off script reads existing `User.onboardingData` blobs → populates `UserPreferenceProfile` + `UserPreferredNeighbourhood`. `updateOnboarding` in `users.service.ts` is extended to **also** write the structured tables (dual-write; keep the blob).

### 7.3 v1 feed ranking — deterministic & explainable
Move ranking server-side into a new **`FeedModule`** (`GET /feed`) that wraps DDF search results and re-scores:

```
score(listing, user) =
    w_neighbourhood * neighbourhoodMatch(listing, profile.neighbourhoods)
  + w_price         * priceFit(listing.price, profile.budgetMin/Max)
  + w_beds          * bedsFit(listing.beds, profile.bedroomsMin)
  + w_type          * typeMatch(listing.propertySubType, profile.homeType)
  + w_lifestyle     * lifestyleMatch(listing.neighbourhood, profile.lifestyleWeights)
  + w_behaviour     * behaviourBoost(listing, recent property_viewed/saved signals)
  + w_freshness     * recency(listing.listedAt)
  - penalty(already_seen via feed_card_impression)
```

- Weights in **config/feature flag** — tunable without deploy.
- Fully explainable ("shown because: your Kitsilano preference + within budget") — trust + debuggability.
- **Anonymous/no-profile** users fall back to current behaviour (video-first, recency) — no regression.
- Gate behind PostHog flag `feed_ranking_v1`, tag events with `feed_variant`, compare **feed engagement rate** vs control.

### 7.4 Path to smarter later (out of scope)
Behavioural embeddings (listing2vec / user vectors from view/save sequences) → learned reranker. The `AnalyticsEvent` table is the training substrate. Deferred.

---

## 8. Privacy, Consent & Compliance

- **PIPEDA (federal) + BC PIPA:** meaningful consent for collection + purpose limitation → a **consent banner** before any non-essential (analytics/personalization) tracking. Strictly-necessary auth cookies (Clerk) are exempt; product analytics is **not** — gate `posthog-js` init and `/events` behind consent.
- **Consent gating (concrete):** first-visit banner (accept / reject / manage), choice in a first-party cookie. Init `posthog-js` with `opt_out_capturing_by_default: true`, `opt_in()` only after consent. Server `/events` honors a `consent` signal and drops non-essential events if not granted. Strictly-necessary server conversion events tied to explicit user action (e.g. `seller_lead_submitted` where the user typed their contact info) can be argued necessary — get legal sign-off.
- **CASL (anti-spam):** relevant the moment we email leads. Requires **express/implied consent + identification + unsubscribe** in every commercial message. v1 only needs to **capture consent state** at lead submission (`seller_lead_submitted` → store `emailConsent`). No sending in v1.
- **Anonymous id:** first-party UUID, not tied to PII until `identify`. Rotate/clear on consent-withdrawal.
- **PII minimization:** never send raw email/phone/name to PostHog. `SellerLead` PII stays in Postgres only. Search queries and addresses can contain PII — **truncate to city-level** or hash before analytics. `user_id` = clerkId (opaque), not email.
- **Data retention:** proposal — `AnalyticsEvent` raw retained 13 months then aggregated; PostHog retention per its settings. Monthly prune cron (mirror DdfSyncLog/schedule pattern). Partition `AnalyticsEvent` by month if volume grows.
- **Right to erasure:** on account deletion, delete `AnalyticsEvent` by `user_id` + issue a PostHog delete-person request. Hook into existing user lifecycle.
- **CREA / DDF constraints:** DDF listing data carries **attribution + display requirements** and ToU limits on redistribution/derived use. (1) **Don't expose raw DDF listing datasets in any public/embeddable dashboard** — internal analytics referencing `listing_key` + our own engagement metrics is fine; re-publishing listing fields is not. (2) Any **derived/aggregated market stats** shown to users must respect CREA rules — flag for legal. Keep listing attribution (agent/office/realtor.ca URL) intact wherever a listing surfaces, including personalized feed cards.

---

## 9. Phased Rollout Plan

**Phase 0 — Foundations & consent** (exit: legally & technically capture one event end-to-end)
- Choose region/residency (user decision). Consent banner + opt-in wiring. `posthog-js` behind consent; `posthog-node` in API. `AnalyticsModule` + `POST /events` (throttled) + `AnalyticsEvent` table + migration. One event (`page_viewed`) flowing client → PostHog + Postgres.
- **Exit:** an event appears in PostHog and in `AnalyticsEvent`, only after consent.

**Phase 1 — Core taxonomy & conversion accuracy** (exit: primary funnel visible)
- Typed `track()` wrapper + full catalog instrumented client-side. Server-side tracking for `signed_up`, `property_saved`, `search_performed`, `seller_lead_submitted`. Link `SellerLead` → `User`; forward `anonymous_id` on public search. Onboarding per-step events. Growth + Conversion + Onboarding dashboards.
- **Exit:** primary funnel + onboarding drop-off are live and sane.

**Phase 2 — Structured profile & personalized feed** (exit: ranked feed A/B live)
- `UserPreferenceProfile` + `UserPreferredNeighbourhood` + dual-write + backfill. `FeedModule` `GET /feed` with rules-based ranker behind `feed_ranking_v1`. FE feed consumes `/feed`, tags `feed_variant`, emits impression/click.
- **Exit:** variant vs control engagement rate is measurable; no regression for anonymous users.

**Phase 3 — Ops hardening & scale** (exit: on-call-ready + scale path documented)
- `/health` + `/health/deep`, uptime monitor, Sentry APM, `EventIngestLog`. Retention prune cron + erasure hook. Optional Metabase companion. Documented escape hatch: Redis ingest buffer + ClickHouse if volume outgrows Postgres.

---

## 10. Task Breakdown

See `TASKS.md` → section "📊 Data Pipeline — analytics + personalization" for the tracked checklist (DATA-01…DATA-20).

---

## 11. Open Questions / Decisions

**Resolved 2026-07-01:**
1. ✅ **Data residency** — **PostHog EU Cloud** (fast, low-ops, PIPEDA-defensible). Not self-hosting for v1.
2. ✅ **Tool choice** — **PostHog** endorsed. No existing analytics stack to migrate from.
8. ✅ **Feed ranking scope** — **deterministic rules for v1**; move to an AI/learned reranker in the **next release** once enough event data is collected (§7.4). This makes the owned `AnalyticsEvent` table doubly important — it's the training substrate.

**Still open:**
3. **Budget ceiling** — expected monthly event volume + spend cap? Determines whether session replay is on and when the free tier is exceeded.
4. **Legal review owner** — who signs off on consent banner copy, CASL consent capture, CREA/DDF attribution on user-facing derived stats?
5. **Consent strictness** — hard opt-in (no analytics until accept) vs legitimate-interest for first-party conversion events? Affects funnel completeness.
6. **North-star endorsement** — agree on "Weekly users who saved ≥1 property", or prefer a lead-based north-star (weekly qualified leads)?
7. **Retention window** — is 13 months for raw `AnalyticsEvent` acceptable?

---

## Critical Files for Implementation
- `api/prisma/schema.prisma` — new `AnalyticsEvent`, `UserPreferenceProfile`, `UserPreferredNeighbourhood`; `SellerLead.userId`
- `api/src/modules/users/users.service.ts` — `updateOnboarding` dual-write; server-side `property_saved`
- `src/lib/api/client.ts` — axios + Clerk-token pattern to reuse for `/events` mirror and `/feed`
- `src/app/(feed)/feed/page.tsx` — swap to personalized `/feed`; emit impression/click; existing IntersectionObserver hook
- `api/src/app.module.ts` — register `AnalyticsModule` + `FeedModule` + `ThrottlerModule`
- Also: `src/components/onboarding/OnboardingWizard.tsx` (per-step events), `api/src/main.ts` (throttler/helmet TODOs), `api/src/common/guards/clerk-auth.guard.ts` (opportunistic auth on `/events`)
