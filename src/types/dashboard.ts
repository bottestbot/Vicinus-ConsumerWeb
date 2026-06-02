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
