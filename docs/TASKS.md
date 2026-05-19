# Vicinus — Development Tasks

> Managed by: Principal SDE | Last updated: May 2026

---

## Sprint 0 — Project Setup & CREA DDF Integration

### Frontend
- [ ] `FE-001` Scaffold Next.js 14 project (App Router, TypeScript)
- [ ] `FE-002` Configure Tailwind CSS + shadcn/ui
- [ ] `FE-003` Set up Clerk (auth provider, middleware, env vars)
- [ ] `FE-004` Configure Mapbox GL JS
- [ ] `FE-005` Set up Zustand stores (searchStore, userStore)
- [ ] `FE-006` Set up React Query (TanStack) + Axios API client
- [ ] `FE-007` Set up global layout (Navbar, Footer)
- [ ] `FE-008` Configure environment variables

### Backend
- [ ] `BE-001` Scaffold NestJS project (TypeScript)
- [ ] `BE-002` Set up Prisma ORM + PostgreSQL connection
- [ ] `BE-003` Enable PostGIS extension in PostgreSQL
- [ ] `BE-004` Run initial migrations (all schema tables)
- [ ] `BE-005` Set up Redis connection
- [ ] `BE-006` Configure Clerk webhook + JWT guard
- [ ] `BE-007` Set up Algolia client
- [ ] `BE-008` Set up OpenAPI / Swagger docs
- [ ] `BE-009` Set up global exception filter + logging

### CREA DDF Integration
- [ ] `DDF-001` Build `DdfAuthService` — OAuth2 client_credentials token fetch + cache in Redis (55 min TTL)
- [ ] `DDF-002` Build `DdfPropertySync` — full initial sync of all Property records (paginate via `@odata.nextLink`)
- [ ] `DDF-003` Build `DdfMemberSync` — full initial sync of all Member (agent) records
- [ ] `DDF-004` Build `DdfOfficeSync` — full initial sync of all Office (brokerage) records
- [ ] `DDF-005` Build `DdfOpenHouseSync` — sync OpenHouse records
- [ ] `DDF-006` Implement incremental sync using `ModificationTimestamp gt {lastSync}` filter
- [ ] `DDF-007` Schedule property sync every 15 min (`@Cron`)
- [ ] `DDF-008` Schedule member/office sync every 1 hour
- [ ] `DDF-009` Log sync runs to `ddf_sync_log` table (records synced, last timestamp, errors)
- [ ] `DDF-010` Push upserted properties to Algolia index on every sync
- [ ] `DDF-011` Store DDF credentials in env vars only — add to `.gitignore` validation

---

## Sprint 1 — Auth & Onboarding

### Frontend
- [ ] `FE-101` Build Sign In page (`/sign-in`) — email/password + Google + Apple
- [ ] `FE-102` Build Sign Up page (`/sign-up`) — role selector (Buyer/Agent) + form
- [ ] `FE-103` Add "Keep me signed in for 30 days" checkbox
- [ ] `FE-104` Add Forgot Password flow
- [ ] `FE-105` Protect authenticated routes with Clerk middleware
- [ ] `FE-106` Redirect post-auth to dashboard

### Backend
- [ ] `BE-101` Build Auth module — Clerk webhook handler (user created/updated)
- [ ] `BE-102` Build Users module — create user on Clerk webhook
- [ ] `BE-103` Implement ClerkAuthGuard for protected endpoints
- [ ] `BE-104` Implement CurrentUser decorator
- [ ] `BE-105` `GET /users/me` — return current user profile

---

## Sprint 2 — Landing Page

### Frontend
- [ ] `FE-201` Build Landing page (`/`) — hero section with search bar
- [ ] `FE-202` Build CuratedHighlights component — featured property cards
- [ ] `FE-203` Build ContextualLiving section — editorial lifestyle grid
- [ ] `FE-204` Build EditorialBanner — "Beyond Data, The Vicinus Standard"
- [ ] `FE-205` Implement Navbar with Sign In CTA
- [ ] `FE-206` Build Footer

---

## Sprint 3 — Property Search & Map

### Frontend
- [ ] `FE-301` Build Search page (`/search`) split-pane layout (Map + List)
- [ ] `FE-302` Integrate Mapbox GL JS — aerial dark map style
- [ ] `FE-303` Build SearchBar component — query input with autocomplete
- [ ] `FE-304` Build FilterPanel — all filter groups:
  - Listing type, Price range, Beds & Baths, Home type, Size
  - Advanced: Year built, Basement, Stories, Parking
  - Listing status: Days listed, Open houses, Coming soon
  - Financial: Monthly payment, HOA fee
  - Rental: Pet-friendly, Laundry, Utilities, Furnished, Short-term
- [ ] `FE-305` Build ViewToggle — List / Map / Both
- [ ] `FE-306` Build SearchResultCard — property card in list view
- [ ] `FE-307` Render price pins on Mapbox map
- [ ] `FE-308` Build CuratorChoiceCard — featured listing panel
- [ ] `FE-309` Implement Save Search functionality
- [ ] `FE-310` Sync map bounds → filter results on pan/zoom

### Backend
- [ ] `BE-301` Build Search module — `GET /search` with all filter params
- [ ] `BE-302` PostGIS bounding box query (map viewport)
- [ ] `BE-303` Algolia index sync for properties
- [ ] `BE-304` `GET /search/map-pins` — lightweight geo + price data
- [ ] `BE-305` Redis cache for search results (2 min TTL)
- [ ] `BE-306` Saved searches CRUD (`/users/me/searches`)

---

## Sprint 4 — Property Detail

### Frontend
- [ ] `FE-401` Build Property Detail page (`/properties/[id]`)
- [ ] `FE-402` Build PropertyGallery — hero image + thumbnail strip
- [ ] `FE-403` Build PropertyStats — price, beds, baths, type, sqft, parking
- [ ] `FE-404` Build NeighbourhoodContextScore — walk score, lifestyle score
- [ ] `FE-405` Build MortgageAnalysis — payment calculator widget
- [ ] `FE-406` Build NearbyOpenHouses — cards carousel
- [ ] `FE-407` Build MarketContext — days on market, trend, demand level
- [ ] `FE-408` Build AssessmentHistory — sortable table
- [ ] `FE-409` Build SalesHistory — sortable table
- [ ] `FE-410` Build ListingActivityMap — nearby price comparison
- [ ] `FE-411` Build ActionBar — Save / Share / Contact Agent
- [ ] `FE-412` Track visited property on page load

### Backend
- [ ] `BE-401` `GET /properties/:id` — full property detail
- [ ] `BE-402` `GET /properties/:id/nearby-open-houses`
- [ ] `BE-403` `GET /properties/:id/market-context`
- [ ] `BE-404` `GET /properties/:id/assessment-history`
- [ ] `BE-405` `GET /properties/:id/sales-history`
- [ ] `BE-406` `GET /properties/:id/similar`
- [ ] `BE-407` `POST /users/me/visited/:propertyId` — track visit
- [ ] `BE-408` Redis cache for property detail (10 min TTL)

---

## Sprint 5 — Neighbourhood Pages

### Frontend
- [ ] `FE-501` Build Neighbourhood page (`/neighbourhoods/[slug]`)
- [ ] `FE-502` Build NeighbourhoodHero — full-bleed video + name overlay
- [ ] `FE-503` Build NeighbourhoodMetrics — median price, walk, transit, grade
- [ ] `FE-504` Build NeighbourhoodBio — editorial description
- [ ] `FE-505` Build LocalEssentials — education, healthcare, parks, childcare
- [ ] `FE-506` Build LiveListings — active properties carousel
- [ ] `FE-507` Build NeighbourhoodFlavors — dining + lifestyle highlights
- [ ] `FE-508` Build AreaSpecialists — agent cards
- [ ] `FE-509` Build NeighbourhoodCTA — Explore / Tour CTAs

### Backend
- [ ] `BE-501` `GET /neighbourhoods` — list all neighbourhoods
- [ ] `BE-502` `GET /neighbourhoods/:slug` — detail
- [ ] `BE-503` `GET /neighbourhoods/:slug/listings` — live listings
- [ ] `BE-504` `GET /neighbourhoods/:slug/essentials` — local essentials
- [ ] `BE-505` `GET /neighbourhoods/:slug/agents` — area specialists
- [ ] `BE-506` Redis cache for neighbourhood data (30 min TTL)

---

## Sprint 6 — Dashboard

### Frontend
- [ ] `FE-601` Build Dashboard page (`/dashboard`)
- [ ] `FE-602` Build WelcomeBanner — personalized greeting + 2-line activity summary
- [ ] `FE-603` Build FeaturedProperty — hero recommended listing
- [ ] `FE-604` Build VecinusPanel — agent recommendations
- [ ] `FE-605` Build SavedProperties — bookmarked listings grid
- [ ] `FE-606` Build VisitedProperties — recently viewed grid
- [ ] `FE-607` Build EditorialCurations — curated content row

### Backend
- [ ] `BE-601` `GET /users/me/saved` — saved properties list
- [ ] `BE-602` `GET /users/me/visited` — visited properties list
- [ ] `BE-603` `GET /editorial` — editorial curations
- [ ] `BE-604` `GET /users/me/dashboard` — aggregated dashboard data (saved, visited, recommended)

---

## Sprint 7 — Polish & QA

- [ ] `QA-001` Cross-browser testing (Chrome, Safari, Firefox)
- [ ] `QA-002` Responsive design (mobile, tablet, desktop)
- [ ] `QA-003` Accessibility audit (WCAG 2.1 AA)
- [ ] `QA-004` Performance audit (Lighthouse score > 90)
- [ ] `QA-005` API error states and loading skeletons on all pages
- [ ] `QA-006` Empty states for saved / visited / search with no results
- [ ] `QA-007` SEO meta tags on all pages (Next.js Metadata API)
- [ ] `QA-008` OpenAPI docs review and finalization
- [ ] `QA-009` Security review — auth, rate limiting, CORS
- [ ] `QA-010` Environment variables audit (no secrets in client bundle)
- [ ] `QA-011` **CREA DDF compliance audit** — verify every property card/detail shows: agent name + title, brokerage name, "Powered by REALTOR.ca" logo linked to realtor.ca, lead form on detail pages

---

## Backlog (Post-MVP)

- [ ] Agent dashboard and listing management
- [ ] Property inquiry / contact form with email notification
- [ ] Commute time overlay on map
- [ ] Mobile app (React Native or Flutter consuming same REST API)
- [ ] Admin panel for editorial content management
- [ ] Algolia analytics for search insights
- [ ] Push notifications for saved search alerts

---

*Total MVP tasks: ~90 | Estimated sprints: 7 (2-week sprints = ~14 weeks)*
