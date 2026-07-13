// ─── Property Detail Types ────────────────────────────────────────────────────

export interface AssessmentRecord {
  year: number
  assessedValue: number
  landValue: number
  buildingValue: number
  taxes: number
}

export interface SaleRecord {
  date: string
  price: number
  type: 'MLS Sale' | 'New Listing' | 'Price Change'
}

export interface NearbyListing {
  id: string
  latitude: number
  longitude: number
  price: number
  address: string
  beds: number
  baths: number
  sqft: number
  imageUrl: string
}

export interface OpenHouseProperty {
  id: string
  /** The open house's own DDF OpenHouseKey — needed to add it to the schedule. */
  openHouseKey: string
  address: string
  city: string
  province: string
  price: number
  beds: number
  baths: number
  sqft: number
  imageUrl: string
  openHouseDate: string
  openHouseStartTime: string
  openHouseEndTime: string
  agentName: string
  brokerageName: string
}

// ─── Facts & features (Redfin-style tabbed detail block) ───────────────────────

export interface PropertyRoom {
  type: string | null
  level: string | null
  dimensions: string | null
}

export interface PropertyFactsInterior {
  appliances: string[]
  rooms: PropertyRoom[]
  bedroomsAboveGrade: number | null
  bedroomsBelowGrade: number | null
  bathsTotal: number | null
  bathsFull: number | null
  bathsPartial: number | null
  heating: string[]
  cooling: string[]
  flooring: string[]
  basement: string[]
  fireplacesTotal: number | null
  fireplaceYN: boolean | null
  fireplaceFeatures: string[]
  aboveGradeFinishedArea: number | null
  belowGradeFinishedArea: number | null
  securityFeatures: string[]
}

export interface PropertyFactsExterior {
  parkingTotal: number | null
  parkingFeatures: string[]
  lotSizeArea: number | null
  lotSizeUnits: string | null
  lotSizeDimensions: string | null
  frontageLength: number | null
  frontageUnits: string | null
  lotFeatures: string[]
  poolFeatures: string[]
  view: string[]
  viewYN: boolean | null
  exteriorFeatures: string[]
  constructionMaterials: string[]
  architecturalStyle: string[]
  structureType: string[]
  fencing: string[]
  sewer: string[]
  waterSource: string[]
  zoning: string | null
  zoningDescription: string | null
  yearBuilt: number | null
  stories: number | null
}

export interface PropertyFactsFinance {
  price: number | null
  pricePerSqft: number | null
  taxAnnualAmount: number | null
  taxYear: number | null
  listedAt: string | null
  commonInterest: string | null
  subdivisionName: string | null
  associationFee: number | null
  associationFeeFrequency: string | null
  associationFeeIncludes: string[]
  propertySubType: string | null
}

export interface PropertyFactsDetails {
  interior: PropertyFactsInterior
  exterior: PropertyFactsExterior
  finance: PropertyFactsFinance
}

export interface PropertyDetail {
  id: string
  address: string
  city: string
  province: string
  postalCode: string
  price: number
  beds: number
  baths: number
  sqft: number
  propertyType: string
  status: 'Active' | 'Sold' | 'Coming Soon' | 'Open House'
  daysOnMarket: number
  listingType: 'For Sale' | 'For Rent'
  latitude: number
  longitude: number
  images: string[]
  agentName: string
  agentTitle: string
  brokerageName: string
  agentPhone?: string
  agentPhoto?: string
  mlsNumber: string
  yearBuilt?: number
  parking?: number
  stories?: number
  basement?: boolean
  hoaFee?: number
  matchScore?: number
  description?: string
  features?: string[]
  // Neighbourhood
  neighbourhood?: string
  walkScore?: number
  lifestyleScore?: number
  lifestyleLabel?: string
  // Market
  pricePerSqft?: number
  priceChange?: number
  demandLevel?: 'Low' | 'Moderate' | 'High' | 'Very High'
  // Extended data
  assessmentHistory?: AssessmentRecord[]
  salesHistory?: SaleRecord[]
  nearbyListings?: NearbyListing[]
  nearbyOpenHouses?: OpenHouseProperty[]
  // Facts & features (live DDF only; mock data lacks it)
  details?: PropertyFactsDetails
  // Media (live DDF only) — branded/unbranded virtual tour + YouTube video tour
  virtualTourUrl?: string
  youtubeUrl?: string
}

