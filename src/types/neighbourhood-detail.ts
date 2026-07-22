// Aggregate shape served by `GET /neighbourhoods/:slug/detail` (NBHD-09).
// The backend endpoint is being built in parallel; the frontend consumes this
// shape via `getNeighbourhoodDetail` (src/lib/api/neighbourhoods.ts), which
// falls back to composing today's live endpoints until `/detail` ships.

export interface PoiItem {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  /** Straight-line distance from the neighbourhood centroid, in metres. */
  distanceM: number
}

export interface PropertySummary {
  /** DDF ListingKey — routes /properties/:id. Never the local Property.id. */
  id: string
  address: string
  /** ListPrice, falling back to LeaseAmount on rentals. */
  price: number
  /** DDF LeaseAmountFrequency — present only on leases. */
  leaseFrequency?: string | null
  beds: number
  baths: number
  sqft: number
  imageUrl: string
  slug: string
  /** DDF ListingURL — deep-links the REALTOR.ca badge. */
  realtorUrl?: string | null
  agentName?: string | null
  brokerageName?: string | null
  mlsNumber?: string | null
  /** True when this listing matches the signed-in user's priorities — renders
   *  the lime "For you" flag. Set by the personalization layer (NBHD-08). */
  isMatch?: boolean
}

export interface NeighbourhoodDetailResponse {
  neighbourhood: {
    id: string
    slug: string
    name: string
    city: string
    description: string
    heroImageUrl: string
    flavors: string[]
    centroidLat: number
    centroidLng: number
  }
  marketSnapshot: {
    medianPrice: number
    /** 30-day price change, as a signed percentage (e.g. 2.4 = +2.4%). */
    priceChange30d: number
    daysOnMarket: number
    activeListings: number
  }
  livability: {
    score: number
    percentile: number
    breakdown: {
      walkability: number
      schools: number
      amenities: number
      /** Null when no agency GTFS coverage exists for the area. */
      transit: number | null
    }
    /**
     * The pool the percentile was ranked against (e.g. "BC"). "Top X%" must be
     * labelled with this, not the city — the backend ranks province-wide, so
     * "Top 1% in Mission" for a BC-wide rank would be a false claim.
     */
    region?: string | null
    weightsVersion: string
  }
  localEssentials: {
    schools: PoiItem[]
    healthcare: PoiItem[]
    parks: PoiItem[]
    shopAndEat: PoiItem[]
  }
  localInfoTiles: {
    staticMapUrl: string | null
    streetViewUrl: string | null
  }
  liveListings: PropertySummary[]
  personalization: {
    matchPercent: number
    reasonChips: string[]
    cautionChips: string[]
    isPersonalized: boolean
  } | null
}
