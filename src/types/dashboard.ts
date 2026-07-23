// Dashboard API response types

export interface DashboardUser {
  id: string
  clerkId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: string
}

export interface DashboardProperty {
  id: string
  ddfListingKey: string
  status: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  streetNumber: string | null
  streetName: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  primaryPhotoUrl: string | null
  agentName: string | null
  brokerageName: string | null
  mlsNumber: string | null
  /** DDF ListingURL — deep-links the "Powered by REALTOR.ca" badge. */
  realtorUrl?: string | null
}

export interface SavedPropertyRecord {
  id: string
  propertyId: string
  createdAt: string
  property: DashboardProperty
}

export interface VisitedPropertyRecord {
  id: string
  propertyId: string
  visitedAt: string
  property: DashboardProperty
}

export interface EditorialCuration {
  id: string
  title: string | null
  description: string | null
  imageUrl: string | null
  tag: string | null
  publishedAt: string | null
}

export interface DashboardData {
  user: DashboardUser
  saved: SavedPropertyRecord[]
  visited: VisitedPropertyRecord[]
  editorial: EditorialCuration[]
}

// ─── Sprint 8: Alerts / Open House Scheduler ────────────────────────────────

export type AlertType = 'NEW_LISTING' | 'PRICE_DROP' | 'STATUS_CHANGE' | 'OPEN_HOUSE'

export interface Alert {
  id: string
  type: AlertType
  propertyId: string | null
  ddfOpenHouseKey: string | null
  payload: Record<string, unknown>
  createdAt: string
  readAt: string | null
  property: DashboardProperty | null
}

export interface AlertsResponse {
  alerts: Alert[]
  total: number
  unreadCount: number
}

export type OpenHouseVisitStatus = 'PLANNED' | 'ATTENDED' | 'SKIPPED'

export interface OpenHouseVisit {
  id: string
  ddfOpenHouseKey: string
  status: OpenHouseVisitStatus
  createdAt: string
  updatedAt: string
  openHouseDate: string | null
  openHouseStartTime: string | null
  openHouseEndTime: string | null
  property: DashboardProperty | null
}

export interface OpenHouseVisitGroup {
  date: string
  visits: OpenHouseVisit[]
}

// ─── Vicinus IQ Brief (BRIEF-09…12) ─────────────────────────────────────────

export type BriefHighlightKind = 'price_drop' | 'new_listing' | 'status_change' | 'open_house'

export interface BriefHighlight {
  id: string
  kind: BriefHighlightKind
  /** Short deterministic label, e.g. "$40,000 price drop". Never model-authored. */
  label: string
  /** Secondary line, e.g. an address. Nullable. */
  subLabel: string | null
  /** Real in-app route, already ListingKey-routed by the backend (BRIEF-08). */
  href: string
  listingKey: string | null
}

export interface Brief {
  headline: string
  body: string
  highlights: BriefHighlight[]
  /** ISO timestamp the brief copy was generated. */
  generatedAt: string
  /** Gemini failed → templated copy from the same facts object (BRIEF-07). */
  isFallback: boolean
  /** No alerts in the trailing 7 days → forward-looking variant (BRIEF-11). */
  isEmpty: boolean
}
