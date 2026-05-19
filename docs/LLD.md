# Vicinus — Low-Level Design (LLD)

> Version 1.1 | Principal SDE Review | Updated with CREA DDF integration

---

## 1. Frontend Architecture

### 1.1 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx            # Main shell with nav
│   │   ├── page.tsx              # Landing / Home
│   │   ├── dashboard/page.tsx
│   │   ├── search/page.tsx
│   │   ├── properties/
│   │   │   └── [id]/page.tsx     # Property Detail
│   │   └── neighbourhoods/
│   │       └── [slug]/page.tsx   # Neighbourhood page
│   └── api/                      # Next.js API routes (BFF layer)
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   └── SignUpForm.tsx
│   ├── property/
│   │   ├── PropertyCard.tsx          # Includes REALTOR.ca compliance elements
│   │   ├── PropertyGallery.tsx
│   │   ├── PropertyStats.tsx
│   │   ├── MortgageAnalysis.tsx
│   │   ├── MarketContext.tsx
│   │   ├── AssessmentHistory.tsx
│   │   ├── SalesHistory.tsx
│   │   ├── NearbyOpenHouses.tsx
│   │   └── RealtorCompliance.tsx     # "Powered by REALTOR.ca" + lead form
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── MapView.tsx
│   │   ├── ListView.tsx
│   │   └── SearchResultCard.tsx
│   ├── neighbourhood/
│   │   ├── NeighbourhoodHero.tsx
│   │   ├── NeighbourhoodMetrics.tsx
│   │   ├── LocalEssentials.tsx
│   │   ├── NeighbourhoodFlavors.tsx
│   │   └── AreaSpecialists.tsx
│   ├── dashboard/
│   │   ├── WelcomeBanner.tsx
│   │   ├── FeaturedProperty.tsx
│   │   ├── SavedProperties.tsx
│   │   ├── VisitedProperties.tsx
│   │   └── EditorialCurations.tsx
│   └── agent/
│       └── AgentCard.tsx
│
├── features/
│   ├── auth/useAuth.ts
│   ├── search/
│   │   ├── useSearch.ts
│   │   ├── useFilters.ts
│   │   └── useSavedSearch.ts
│   ├── property/
│   │   ├── useProperty.ts
│   │   └── useSavedProperties.ts
│   └── neighbourhood/useNeighbourhood.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Axios instance with auth headers
│   │   ├── properties.ts
│   │   ├── search.ts
│   │   ├── neighbourhoods.ts
│   │   └── users.ts
│   ├── mapbox.ts
│   └── utils.ts
│
├── store/
│   ├── searchStore.ts            # Zustand: filters, map state
│   └── userStore.ts              # Zustand: user session
│
└── styles/globals.css
```

---

### 1.2 REALTOR.ca Compliance Component

Every property card and detail page must render this. It is a shared component, not optional.

```tsx
// components/property/RealtorCompliance.tsx
interface RealtorComplianceProps {
  listingUrl: string        // DDF ListingURL field → realtor.ca link
  agentName: string         // DDF Member: MemberFirstName + MemberLastName
  agentTitle: string        // DDF Member: JobTitle
  brokerageName: string     // DDF Office: OfficeName
  showLeadForm?: boolean    // true on detail page, false on cards
}

// Renders:
// 1. Agent name + title + brokerage name
// 2. "Powered by REALTOR.ca" logo → links to listingUrl on realtor.ca
// 3. Link to property on brokerage/agent site
// 4. REALTOR.ca DDF lead form (on detail page)
```

---

### 1.3 Page Breakdown

#### Property Card (used in Search, Dashboard, Neighbourhood)
```
<PropertyCard>
  <PropertyImage />              # Media[0].MediaURL (PreferredPhotoYN)
  <PropertyPrice />              # ListPrice | LeaseAmount
  <PropertyAddress />            # UnparsedAddress, City, StateOrProvince
  <PropertyMeta />               # BedroomsTotal, BathroomsTotalInteger, LivingArea
  <RealtorCompliance             # MANDATORY on every card
    agentName={...}
    brokerageName={...}
    listingUrl={...}
    showLeadForm={false}
  />
</PropertyCard>
```

#### Property Detail (`/properties/[id]`)
```
<PropertyGallery />              # All Media[] sorted by Order
<PropertyStats />                # Price, Beds, Baths, Type, Sqft, Parking, YearBuilt
<NeighbourhoodContextScore />    # Walk Score (Walk Score API), Lifestyle
<MortgageAnalysis />             # Client-side calculator using ListPrice
<NearbyOpenHouses />             # OpenHouse entity filtered by ListingKey proximity
<MarketContext />                # Days on market (OriginalEntryTimestamp diff), trends
<AssessmentHistory />            # TaxAnnualAmount, TaxYear
<SalesHistory />                 # From our enrichment DB (not DDF)
<RealtorCompliance               # MANDATORY on detail page
  agentName={...}
  agentTitle={...}
  brokerageName={...}
  listingUrl={...}
  showLeadForm={true}            # Renders official CREA lead form
/>
```

---

## 2. Backend Architecture (NestJS)

### 2.1 Module Structure

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── clerk.strategy.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── properties/
│   │   ├── properties.module.ts
│   │   ├── properties.controller.ts
│   │   ├── properties.service.ts
│   │   └── dto/
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   └── algolia.service.ts
│   ├── neighbourhoods/
│   │   ├── neighbourhoods.module.ts
│   │   ├── neighbourhoods.controller.ts
│   │   └── neighbourhoods.service.ts
│   ├── agents/
│   │   ├── agents.module.ts
│   │   ├── agents.controller.ts
│   │   └── agents.service.ts
│   ├── editorial/
│   │   ├── editorial.module.ts
│   │   └── editorial.service.ts
│   └── ddf-sync/
│       ├── ddf-sync.module.ts
│       ├── ddf-sync.service.ts       # Cron job orchestrator
│       ├── ddf-auth.service.ts       # OAuth token management
│       ├── ddf-property.sync.ts      # Property sync logic
│       ├── ddf-member.sync.ts        # Member (agent) sync logic
│       └── ddf-office.sync.ts        # Office (brokerage) sync logic
├── common/
│   ├── guards/clerk-auth.guard.ts
│   ├── decorators/current-user.decorator.ts
│   ├── interceptors/cache.interceptor.ts
│   └── filters/http-exception.filter.ts
└── prisma/
    ├── prisma.module.ts
    ├── prisma.service.ts
    └── schema.prisma
```

---

## 3. CREA DDF Sync Service

### 3.1 OAuth Token Management
```typescript
// ddf-auth.service.ts
class DdfAuthService {
  private token: string
  private expiresAt: Date

  async getToken(): Promise<string> {
    if (this.token && this.expiresAt > new Date(Date.now() + 60_000)) {
      return this.token  // return cached token if > 1 min remaining
    }
    return this.refreshToken()
  }

  private async refreshToken(): Promise<string> {
    // POST https://identity.crea.ca/connect/token
    // grant_type=client_credentials
    // scope=DDFApi_Read
    // Sets this.token + this.expiresAt = now + 3600s
  }
}
```

### 3.2 Sync Schedule
```typescript
// ddf-sync.service.ts
@Cron('*/15 * * * *')           // Every 15 minutes
async syncProperties() { ... }

@Cron('0 * * * *')              // Every hour
async syncMembersAndOffices() { ... }
```

### 3.3 Incremental Sync Query
```
GET /odata/v1/Property
  ?$filter=ModificationTimestamp gt {lastSyncTimestamp}
  &$top=100
  &$orderby=ModificationTimestamp asc

Follow @odata.nextLink until no more pages.
Upsert each record to PostgreSQL by ListingKey.
Push upserted records to Algolia index.
```

### 3.4 DDF Field → DB Column Mapping

#### Property
| DDF Field | DB Column | Notes |
|-----------|-----------|-------|
| `ListingKey` | `ddf_listing_key` | Primary external ID |
| `ListingId` | `ddf_listing_id` | |
| `ListPrice` | `price` | |
| `LeaseAmount` | `lease_amount` | For rental listings |
| `PropertySubType` | `property_sub_type` | House, Condo, etc. |
| `StandardStatus` | `status` | Active, Sold, etc. |
| `BedroomsTotal` | `beds` | |
| `BathroomsTotalInteger` | `baths` | |
| `BathroomsPartial` | `baths_partial` | |
| `LivingArea` | `sqft` | |
| `LotSizeArea` | `lot_size` | |
| `YearBuilt` | `year_built` | |
| `ParkingTotal` | `parking_total` | |
| `UnparsedAddress` | `address` | |
| `StreetNumber` | `street_number` | |
| `StreetName` | `street_name` | |
| `City` | `city` | |
| `StateOrProvince` | `province` | |
| `PostalCode` | `postal_code` | |
| `Latitude` | `lat` | → PostGIS POINT |
| `Longitude` | `lng` | → PostGIS POINT |
| `PublicRemarks` | `description` | |
| `ListingURL` | `realtor_url` | Required for compliance link |
| `ListAgentKey` | `ddf_agent_key` | FK to agents |
| `ListOfficeKey` | `ddf_office_key` | FK to offices |
| `Media[]` | `images` (JSONB) | Array of {url, order, isPrimary} |
| `PhotosCount` | `photos_count` | |
| `OriginalEntryTimestamp` | `listed_at` | |
| `ModificationTimestamp` | `ddf_modified_at` | Used for incremental sync |
| `TaxAnnualAmount` | `tax_annual` | |
| `TaxYear` | `tax_year` | |
| `Heating` | `heating` (JSONB array) | |
| `Cooling` | `cooling` (JSONB array) | |
| `Basement` | `basement` (JSONB array) | |
| `ParkingFeatures` | `parking_features` (JSONB) | |
| `InternetEntireListingDisplayYN` | `display_on_internet` | Must check before showing |

#### Member (Agent)
| DDF Field | DB Column |
|-----------|-----------|
| `MemberKey` | `ddf_member_key` |
| `MemberFirstName` + `MemberLastName` | `full_name` |
| `JobTitle` | `job_title` |
| `MemberOfficePhone` | `phone` |
| `MemberEmailYN` | `email_visible` |
| `OfficeKey` | `ddf_office_key` |
| `MemberStateOrProvince` | `province` |
| `Media[0].MediaURL` | `avatar_url` |
| `MemberSocialMedia[]` | `social_media` (JSONB) |

#### Office (Brokerage)
| DDF Field | DB Column |
|-----------|-----------|
| `OfficeKey` | `ddf_office_key` |
| `OfficeName` | `name` |
| `OfficePhone` | `phone` |
| `OfficeAddress1` | `address` |
| `OfficeCity` | `city` |
| `Media[0].MediaURL` | `logo_url` |

---

## 4. Database Schema (PostgreSQL + PostGIS)

### users
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
clerk_id      VARCHAR UNIQUE NOT NULL
email         VARCHAR UNIQUE NOT NULL
full_name     VARCHAR
role          VARCHAR NOT NULL DEFAULT 'buyer'   -- buyer | agent | admin
avatar_url    VARCHAR
created_at    TIMESTAMPTZ DEFAULT now()
updated_at    TIMESTAMPTZ DEFAULT now()
```

### properties (synced from CREA DDF)
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
ddf_listing_key       VARCHAR UNIQUE NOT NULL     -- DDF ListingKey
ddf_listing_id        VARCHAR
realtor_url           VARCHAR NOT NULL             -- ListingURL (compliance)
status                VARCHAR DEFAULT 'Active'     -- StandardStatus
display_on_internet   BOOLEAN DEFAULT true         -- InternetEntireListingDisplayYN

-- Pricing
price                 DECIMAL(15,2)               -- ListPrice
lease_amount          DECIMAL(15,2)               -- LeaseAmount
lease_frequency       VARCHAR                     -- LeaseAmountFrequency

-- Property details
property_sub_type     VARCHAR                     -- Single Family, Condo, etc.
beds                  INTEGER
baths                 DECIMAL(3,1)
baths_partial         INTEGER
sqft                  INTEGER
lot_size              DECIMAL(10,2)
year_built            INTEGER
parking_total         INTEGER
stories               INTEGER

-- Address
address               VARCHAR
street_number         VARCHAR
street_name           VARCHAR
city                  VARCHAR
province              VARCHAR
postal_code           VARCHAR
country               VARCHAR DEFAULT 'Canada'

-- Geo (PostGIS)
location              GEOGRAPHY(POINT, 4326)

-- Content
description           TEXT
images                JSONB                       -- [{url, order, isPrimary}]
photos_count          INTEGER

-- Features (from DDF arrays)
heating               JSONB
cooling               JSONB
basement              JSONB
parking_features      JSONB
exterior_features     JSONB
flooring              JSONB
appliances            JSONB

-- Tax
tax_annual            DECIMAL(12,2)
tax_year              INTEGER

-- Relations
ddf_agent_key         VARCHAR REFERENCES agents(ddf_member_key)
ddf_office_key        VARCHAR REFERENCES offices(ddf_office_key)
neighbourhood_id      UUID REFERENCES neighbourhoods(id)

-- Vicinus metadata
is_curator_pick       BOOLEAN DEFAULT false
editorial_tag         VARCHAR

-- Sync tracking
listed_at             TIMESTAMPTZ
ddf_modified_at       TIMESTAMPTZ
synced_at             TIMESTAMPTZ DEFAULT now()
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

### agents (synced from CREA DDF Member)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
ddf_member_key    VARCHAR UNIQUE NOT NULL
full_name         VARCHAR
job_title         VARCHAR
phone             VARCHAR
email_visible     BOOLEAN DEFAULT false
province          VARCHAR
avatar_url        VARCHAR
social_media      JSONB
ddf_office_key    VARCHAR REFERENCES offices(ddf_office_key)
ddf_modified_at   TIMESTAMPTZ
synced_at         TIMESTAMPTZ DEFAULT now()
```

### offices (synced from CREA DDF Office)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ddf_office_key  VARCHAR UNIQUE NOT NULL
name            VARCHAR NOT NULL
phone           VARCHAR
address         VARCHAR
city            VARCHAR
province        VARCHAR
logo_url        VARCHAR
ddf_modified_at TIMESTAMPTZ
synced_at       TIMESTAMPTZ DEFAULT now()
```

### open_houses (synced from CREA DDF OpenHouse)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
ddf_open_house_key VARCHAR UNIQUE NOT NULL
ddf_listing_key   VARCHAR REFERENCES properties(ddf_listing_key)
open_house_date   DATE
start_time        TIME
end_time          TIME
open_house_type   VARCHAR
status            VARCHAR
remarks           TEXT
```

### neighbourhoods (Vicinus-owned)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR NOT NULL
slug            VARCHAR UNIQUE NOT NULL
city            VARCHAR
province        VARCHAR
bio             TEXT
median_price    DECIMAL(15,2)
walk_score      INTEGER
transit_score   INTEGER
living_grade    VARCHAR
video_url       VARCHAR
boundary        GEOGRAPHY(POLYGON, 4326)
created_at      TIMESTAMPTZ DEFAULT now()
```

### local_essentials
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
neighbourhood_id  UUID REFERENCES neighbourhoods(id)
category          VARCHAR     -- education | healthcare | parks | childcare | dining
name              VARCHAR
rating            DECIMAL(2,1)
distance_km       DECIMAL(4,2)
```

### saved_properties
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id)
property_id   UUID REFERENCES properties(id)
created_at    TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, property_id)
```

### visited_properties
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id)
property_id   UUID REFERENCES properties(id)
visited_at    TIMESTAMPTZ DEFAULT now()
```

### saved_searches
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id)
name          VARCHAR
filters       JSONB
created_at    TIMESTAMPTZ DEFAULT now()
```

### editorial_curations
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         VARCHAR
description   TEXT
image_url     VARCHAR
tag           VARCHAR
property_ids  UUID[]
published_at  TIMESTAMPTZ
```

### ddf_sync_log
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
entity          VARCHAR     -- Property | Member | Office | OpenHouse
synced_at       TIMESTAMPTZ DEFAULT now()
records_synced  INTEGER
last_modified_timestamp TIMESTAMPTZ   -- Used as $filter start for next sync
status          VARCHAR     -- success | error
error_message   TEXT
```

---

## 5. REST API Endpoints

### Auth
```
POST   /auth/webhook                    # Clerk webhook — user created/updated
```

### Users
```
GET    /users/me
PATCH  /users/me
GET    /users/me/saved
POST   /users/me/saved/:propertyId
DELETE /users/me/saved/:propertyId
GET    /users/me/visited
POST   /users/me/visited/:propertyId
GET    /users/me/searches
POST   /users/me/searches
DELETE /users/me/searches/:id
GET    /users/me/dashboard              # Aggregated: saved, visited, editorial, recommended
```

### Properties
```
GET    /properties                      # List (paginated)
GET    /properties/:id                  # Full detail
GET    /properties/:id/similar
GET    /properties/:id/nearby-open-houses
GET    /properties/:id/market-context
```

### Search
```
GET    /search?q=&city=&province=&minPrice=&maxPrice=
              &beds=&baths=&propertyType=&status=
              &minSqft=&maxSqft=&yearBuiltMin=
              &bbox={west},{south},{east},{north}
              &page=&limit=
GET    /search/map-pins?bbox=           # id + lat + lng + price only (lightweight)
```

### Neighbourhoods
```
GET    /neighbourhoods
GET    /neighbourhoods/:slug
GET    /neighbourhoods/:slug/listings
GET    /neighbourhoods/:slug/essentials
GET    /neighbourhoods/:slug/agents
```

### Agents
```
GET    /agents/:id
GET    /agents/:id/listings
```

### Editorial
```
GET    /editorial
GET    /editorial/:id
```

---

## 6. Algolia Index Schema

### Index: `vicinus_properties`
```json
{
  "objectID": "uuid",
  "ddfListingKey": "4143136",
  "title": "42 Obsidian Way, Vancouver, BC",
  "city": "Vancouver",
  "province": "British Columbia",
  "postalCode": "V6K1A1",
  "price": 2350000,
  "beds": 2,
  "baths": 2,
  "sqft": 1581,
  "propertySubType": "Single Family",
  "status": "Active",
  "isCuratorPick": false,
  "_geoloc": { "lat": 49.266, "lng": -123.155 },
  "primaryImageUrl": "https://ddfcdn.realtor.ca/...",
  "agentName": "Julian Carr",
  "brokerageName": "Sotheby's International Realty",
  "realtorUrl": "www.realtor.ca/real-estate/..."
}
```

---

## 7. State Management (Zustand)

### searchStore
```typescript
interface SearchStore {
  query: string
  filters: {
    minPrice: number | null
    maxPrice: number | null
    beds: number | null
    baths: number | null
    propertyType: string[]
    status: string
    minSqft: number | null
    maxSqft: number | null
    yearBuiltMin: number | null
    parkingMin: number | null
    hasBasement: boolean | null
    petFriendly: boolean | null
  }
  viewMode: 'list' | 'map' | 'both'
  mapBounds: { west: number; south: number; east: number; north: number } | null
  results: Property[]
  isLoading: boolean
  setQuery: (q: string) => void
  setFilter: (key: string, value: any) => void
  resetFilters: () => void
  setViewMode: (m: ViewMode) => void
  setMapBounds: (b: MapBounds) => void
}
```

### userStore
```typescript
interface UserStore {
  user: User | null
  savedPropertyIds: Set<string>
  toggleSaved: (propertyId: string) => void
}
```

---

## 8. Caching Strategy (Redis)

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `property:{id}` | 10 min | Full property detail |
| `search:{hash(query+filters)}` | 2 min | Paginated search results |
| `map-pins:{hash(bbox)}` | 5 min | Lightweight geo + price pins |
| `neighbourhood:{slug}` | 30 min | Neighbourhood detail |
| `editorial:all` | 1 hour | Editorial curations |
| `ddf:token` | 55 min | CREA DDF OAuth token |

---

## 9. Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
```

### Backend (.env)
```
DATABASE_URL=
REDIS_URL=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ALGOLIA_APP_ID=
ALGOLIA_ADMIN_KEY=
DDF_CLIENT_ID=              # CREA DDF credentials — never commit
DDF_CLIENT_SECRET=          # CREA DDF credentials — never commit
DDF_AUTH_URL=https://identity.crea.ca/connect/token
DDF_API_BASE_URL=https://ddfapi.realtor.ca/odata/v1
PORT=3001
```

---

*Document owned by: Principal SDE | Last updated: May 2026*
