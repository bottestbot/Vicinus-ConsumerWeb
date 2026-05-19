# Vicinus — High-Level Design (HLD)

> Version 1.1 | Principal SDE Review | Updated with CREA DDF integration

---

## 1. System Overview

Vicinus is a premium real estate consumer web platform. The system serves two primary user types — **Buyers** and **Agents** — via a web application, with the backend designed to be **platform-agnostic** (consumed by web and future mobile clients via REST API).

All listing data is sourced from **CREA DDF® (Canadian Real Estate Association Data Distribution Facility)** under a licensed contract.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   ┌──────────────────┐          ┌──────────────────┐           │
│   │  Next.js Web App │          │  Mobile App (TBD)│           │
│   └────────┬─────────┘          └────────┬─────────┘           │
└────────────┼───────────────────────────────┼────────────────────┘
             │  HTTPS / REST (OpenAPI)        │
┌────────────▼───────────────────────────────▼────────────────────┐
│                        API GATEWAY                              │
│              (Rate Limiting, Auth Middleware, CORS)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (NestJS)                            │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Auth Module │  │Property Module│  │ Neighbourhood Module │   │
│  │  (Clerk)    │  │              │  │                      │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ User Module │  │ Search Module│  │  Editorial Module    │   │
│  │             │  │  (Algolia)   │  │                      │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│  ┌──────────────────────────────────┐                          │
│  │        DDF Sync Service          │  ← Background job        │
│  │  (CREA DDF → PostgreSQL + Algolia│    runs on schedule      │
│  └──────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
             │              │              │
   ┌─────────▼──┐    ┌──────▼──────┐  ┌───▼──────┐
   │ PostgreSQL  │    │    Redis    │  │ Algolia  │
   │ + PostGIS   │    │   (Cache)   │  │ (Search) │
   └────────────┘    └─────────────┘  └──────────┘
             │
   ┌─────────▼──────────────────────────────────┐
   │              CREA DDF API                  │
   │  https://ddfapi.realtor.ca/odata/v1/       │
   │  OAuth2 (client_credentials)               │
   │  Entities: Property, Member, Office,       │
   │            OpenHouse                       │
   └────────────────────────────────────────────┘
```

---

## 3. CREA DDF Integration

### 3.1 API Details
| Item | Value |
|------|-------|
| Base URL | `https://ddfapi.realtor.ca/odata/v1/` |
| Auth URL | `https://identity.crea.ca/connect/token` |
| Auth Type | OAuth 2.0 `client_credentials` |
| Scope | `DDFApi_Read` |
| Token TTL | 3600 seconds (1 hour) |
| Protocol | OData v1 (`$top`, `$skip`, `$filter`, `$orderby`, `$select`) |
| Pagination | `$top` / `$skip` + `@odata.nextLink` |

### 3.2 Available Entities
| Entity | Description |
|--------|-------------|
| `Property` | Full listing data — price, address, geo, rooms, media, features |
| `Member` | Agent profiles — name, photo, contact, office |
| `Office` | Brokerage details — name, logo, contact |
| `OpenHouse` | Open house events linked to listings |
| `PropertyIdentifier` | Alternate IDs for listings |

### 3.3 Data Sync Strategy

Rather than querying CREA DDF live on every request (adds latency + rate limit risk), we use a **sync-first architecture**:

```
CREA DDF API
    │
    ▼
DDF Sync Service (NestJS Scheduled Job)
    │  Runs every 15 minutes
    │  Uses ModificationTimestamp for incremental sync
    │
    ├──→ PostgreSQL (primary store, PostGIS for geo)
    └──→ Algolia (search index updated on upsert)
```

**Full sync**: On initial setup — paginate through all `Property`, `Member`, `Office` records.

**Incremental sync**: Every 15 min — fetch records where `ModificationTimestamp gt {lastSyncTime}`.

**Deletion sync**: Check `StandardStatus` — mark as inactive if no longer returned.

### 3.4 Compliance Requirements (Mandatory)

Per the CREA DDF® license agreement, every listing display MUST include:

1. **Listing brokerage name** and **listing agent name + title**
2. **"Powered by REALTOR.ca" logo** — linked directly to the corresponding listing on `realtor.ca` (via `ListingURL` field)
3. **Link to property** on the brokerage or agent website (`ListingURL`)
4. **REALTOR.ca DDF® lead form** — must use CREA's official lead form API for contact/inquiry

These are non-negotiable UI requirements enforced on every property card and detail page.

---

## 4. Core Modules

### 4.1 Auth Module
- **Provider**: Clerk
- Handles Sign Up (Buyer / Agent role), Sign In, Social Auth (Google, Apple)
- Issues JWT tokens consumed by both web and mobile
- Role-based access control (RBAC): `buyer`, `agent`, `admin`

### 4.2 Property Module
- Serves synced CREA DDF property data from PostgreSQL
- Enriches with Vicinus-specific metadata (curator picks, editorial tags)
- Endpoints for detail, similar, market context, assessment, sales history

### 4.3 Search Module
- **Engine**: Algolia (full-text + geo search) — fed by DDF Sync Service
- **DB**: PostgreSQL + PostGIS for geo queries (bounding box, radius)
- All CREA DDF filter fields supported
- Map pin data (lat/lng + price label from `Latitude`, `Longitude`, `ListPrice`)

### 4.4 Neighbourhood Module
- Vicinus-owned data (not from CREA DDF)
- Neighbourhood profiles, local essentials, flavors, area specialists
- Live listings pulled from Property module filtered by neighbourhood boundary (PostGIS)

### 4.5 User Module
- User profile (Buyer / Agent)
- Saved properties, visited properties, saved searches
- Activity summary for dashboard

### 4.6 Agent Module
- Synced from CREA DDF `Member` + `Office` entities
- Enriched with Vicinus profile data
- Area specialist associations

### 4.7 Editorial Module
- Vicinus-curated collections ("The Curator's Choice")
- Editorial tags applied to synced properties
- Dashboard editorial content

### 4.8 DDF Sync Service
- NestJS `@Cron` scheduled job
- OAuth token management (auto-refresh before expiry)
- Incremental sync via `ModificationTimestamp`
- Upserts to PostgreSQL + Algolia index

---

## 5. Data Flow

### Property Search Flow
```
User types search query
  → Next.js sends GET /search?q=&filters=&bbox=
  → NestJS Search Module queries Algolia
  → PostGIS query for geo-bounded results
  → Redis cache check (popular searches)
  → Returns paginated property list + map pins
  → Frontend renders map view + list panel
  → Each card shows: agent name, brokerage, "Powered by REALTOR.ca" logo
```

### Property Detail Flow
```
User clicks property
  → GET /properties/:id
  → NestJS fetches from PostgreSQL (synced from DDF)
  → Parallel fetch: neighbourhood context, nearby open houses, market data
  → Visited property event tracked (POST /users/me/visited)
  → Response includes: ListingURL, agent, office, media URLs
  → Frontend renders: REALTOR.ca logo, agent/brokerage, lead form
```

### DDF Sync Flow
```
Cron fires every 15 min
  → Check/refresh OAuth token (identity.crea.ca)
  → Fetch Property?$filter=ModificationTimestamp gt {lastSync}
  → Upsert to PostgreSQL
  → Upsert to Algolia index
  → Fetch Member/Office updates (hourly)
  → Log sync summary
```

### Auth Flow
```
User signs up / signs in
  → Clerk handles authentication
  → Clerk webhook → NestJS creates/updates user record
  → JWT issued by Clerk
  → Frontend stores token (httpOnly cookie for web)
  → All API requests include Bearer token
```

---

## 6. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data Source | CREA DDF OData API | Licensed contract, authoritative Canadian MLS data |
| Sync Strategy | Async background sync → PostgreSQL | Avoids live DDF latency on every request |
| Search | Algolia (fed by sync) | Fast text + geo search without hitting DDF directly |
| Auth | Clerk | Social login, JWT, web + mobile, RBAC built-in |
| Geo | PostGIS | Bounding box + radius queries for map search |
| Cache | Redis | Property detail and search result caching |
| ORM | Prisma | TypeScript-native, great PostgreSQL + PostGIS support |

---

## 7. Non-Functional Requirements

| NFR | Target |
|-----|--------|
| API response time | < 200ms (cached), < 500ms (uncached) |
| Search response | < 100ms (Algolia) |
| Map load (pins) | < 300ms for viewport |
| DDF sync latency | ≤ 15 minutes behind live MLS |
| Uptime | 99.9% |
| Auth token expiry | 30 days (sliding) |

---

## 8. Security

- All API endpoints protected by Clerk JWT validation
- RBAC enforced at module level (`buyer`, `agent`, `admin`)
- CREA DDF credentials stored in environment variables only — never committed
- Rate limiting on search and auth endpoints
- CORS restricted to known origins
- HTTPS enforced everywhere

---

## 9. Scalability

- Redis caching for hot property and neighbourhood data
- Algolia handles search scale independently
- PostgreSQL read replicas for analytics queries
- DDF Sync Service can be scaled to multiple workers with distributed locking
- NestJS modules can be split into microservices at scale

---

*Document owned by: Principal SDE | Last updated: May 2026*
