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
