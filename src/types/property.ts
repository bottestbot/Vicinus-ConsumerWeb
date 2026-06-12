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
}

// ─── Mock Detail Data ─────────────────────────────────────────────────────────

export const MOCK_PROPERTY_DETAILS: Record<string, PropertyDetail> = {
  '1': {
    id: '1',
    address: '1368 Pacific Avenue',
    city: 'San Francisco',
    province: 'CA',
    postalCode: '94115',
    price: 5825000,
    beds: 4,
    baths: 5,
    sqft: 4289,
    propertyType: 'Single Family',
    status: 'Active',
    listingType: 'For Sale',
    daysOnMarket: 3,
    latitude: 37.7952,
    longitude: -122.4257,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    ],
    agentName: 'Sarah Chen',
    agentTitle: 'REALTOR®',
    brokerageName: 'Pacific Luxury Realty',
    agentPhone: '(415) 555-0192',
    mlsNumber: 'ML81921234',
    yearBuilt: 2019,
    parking: 2,
    stories: 3,
    basement: true,
    matchScore: 68,
    description:
      'Exceptional Pacific Heights residence offering panoramic city and bay views. This masterfully crafted home features soaring ceilings, wide-plank white oak floors, and a chef\'s kitchen with Miele appliances. The open-plan living and dining room flows to a south-facing terrace — perfect for entertaining. The primary suite occupies the entire top floor with dual walk-in closets and a spa bath.',
    features: ['Panoramic views', 'Chef\'s kitchen', 'Miele appliances', 'Private terrace', 'Smart home', 'Wine cellar', 'EV charging', 'Radiant heat'],
    neighbourhood: 'Pacific Heights',
    walkScore: 92,
    lifestyleScore: 10,
    lifestyleLabel: 'Walker\'s Paradise',
    pricePerSqft: 1358,
    priceChange: 12.5,
    demandLevel: 'High',
    assessmentHistory: [
      { year: 2024, assessedValue: 5200000, landValue: 2800000, buildingValue: 2400000, taxes: 63700 },
      { year: 2023, assessedValue: 4900000, landValue: 2600000, buildingValue: 2300000, taxes: 60025 },
      { year: 2022, assessedValue: 4600000, landValue: 2450000, buildingValue: 2150000, taxes: 56350 },
      { year: 2021, assessedValue: 4100000, landValue: 2200000, buildingValue: 1900000, taxes: 50225 },
      { year: 2020, assessedValue: 3850000, landValue: 2050000, buildingValue: 1800000, taxes: 47163 },
    ],
    salesHistory: [
      { date: '2024-03-15', price: 5825000, type: 'New Listing' },
      { date: '2022-06-08', price: 5100000, type: 'MLS Sale' },
      { date: '2019-11-22', price: 4250000, type: 'MLS Sale' },
    ],
    nearbyListings: [
      { id: 'n1', latitude: 37.7960, longitude: -122.4230, price: 6200000, address: '1412 Broadway St', beds: 5, baths: 6, sqft: 4800, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80' },
      { id: 'n2', latitude: 37.7938, longitude: -122.4285, price: 4900000, address: '1290 Vallejo St', beds: 3, baths: 4, sqft: 3200, imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80' },
      { id: 'n3', latitude: 37.7970, longitude: -122.4210, price: 3750000, address: '888 Green St', beds: 3, baths: 3, sqft: 2600, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80' },
      { id: 'n4', latitude: 37.7925, longitude: -122.4300, price: 7100000, address: '1680 Jackson St', beds: 6, baths: 7, sqft: 5500, imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80' },
    ],
    nearbyOpenHouses: [
      { id: 'oh1', address: '1412 Broadway St', city: 'San Francisco', province: 'CA', price: 6200000, beds: 5, baths: 6, sqft: 4800, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80', openHouseDate: '2026-06-01', openHouseStartTime: '2:00 PM', openHouseEndTime: '4:00 PM', agentName: 'Marcus Williams', brokerageName: 'Bay Area Prestige Homes' },
      { id: 'oh2', address: '2890 Pacific Ave', city: 'San Francisco', province: 'CA', price: 4100000, beds: 3, baths: 3, sqft: 2700, imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', openHouseDate: '2026-06-01', openHouseStartTime: '1:00 PM', openHouseEndTime: '3:00 PM', agentName: 'Emily Rodriguez', brokerageName: 'North Beach Realty' },
      { id: 'oh3', address: '720 Divisadero St', city: 'San Francisco', province: 'CA', price: 3250000, beds: 4, baths: 3, sqft: 2900, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', openHouseDate: '2026-06-02', openHouseStartTime: '11:00 AM', openHouseEndTime: '1:00 PM', agentName: 'David Park', brokerageName: 'Pacific Luxury Realty' },
    ],
  },
  '2': {
    id: '2',
    address: '2450 Broadway Street',
    city: 'San Francisco',
    province: 'CA',
    postalCode: '94115',
    price: 4200000,
    beds: 3,
    baths: 3,
    sqft: 2800,
    propertyType: 'Condominium',
    status: 'Active',
    listingType: 'For Sale',
    daysOnMarket: 7,
    latitude: 37.7941,
    longitude: -122.4298,
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    ],
    agentName: 'Marcus Williams',
    agentTitle: 'REALTOR®',
    brokerageName: 'Bay Area Prestige Homes',
    agentPhone: '(415) 555-0244',
    mlsNumber: 'ML81921235',
    yearBuilt: 2021,
    parking: 1,
    stories: 1,
    matchScore: 72,
    description: 'The Glass Pavilion — Experience the seamless transition between indoor fabric and outdoor nature. Floor-to-ceiling glass walls frame stunning city views from every room.',
    features: ['Floor-to-ceiling glass', 'Rooftop terrace', 'Smart home', 'Wine cellar'],
    neighbourhood: 'Pacific Heights',
    walkScore: 88,
    lifestyleScore: 9,
    lifestyleLabel: 'Very Walkable',
    pricePerSqft: 1500,
    priceChange: 8.2,
    demandLevel: 'Very High',
    assessmentHistory: [
      { year: 2024, assessedValue: 3800000, landValue: 1800000, buildingValue: 2000000, taxes: 46550 },
      { year: 2023, assessedValue: 3500000, landValue: 1600000, buildingValue: 1900000, taxes: 42875 },
      { year: 2022, assessedValue: 3200000, landValue: 1450000, buildingValue: 1750000, taxes: 39200 },
    ],
    salesHistory: [
      { date: '2024-02-12', price: 4200000, type: 'New Listing' },
      { date: '2021-08-30', price: 3800000, type: 'MLS Sale' },
    ],
    nearbyListings: [
      { id: 'n1', latitude: 37.7948, longitude: -122.4270, price: 4900000, address: '2200 Broadway', beds: 4, baths: 4, sqft: 3400, imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80' },
      { id: 'n2', latitude: 37.7932, longitude: -122.4320, price: 3600000, address: '2800 Vallejo', beds: 3, baths: 3, sqft: 2400, imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80' },
    ],
    nearbyOpenHouses: [
      { id: 'oh1', address: '1368 Pacific Avenue', city: 'San Francisco', province: 'CA', price: 5825000, beds: 4, baths: 5, sqft: 4289, imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', openHouseDate: '2026-06-01', openHouseStartTime: '2:00 PM', openHouseEndTime: '4:00 PM', agentName: 'Sarah Chen', brokerageName: 'Pacific Luxury Realty' },
      { id: 'oh2', address: '890 Vallejo Street', city: 'San Francisco', province: 'CA', price: 3150000, beds: 3, baths: 2, sqft: 2200, imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', openHouseDate: '2026-06-02', openHouseStartTime: '11:00 AM', openHouseEndTime: '1:00 PM', agentName: 'Emily Rodriguez', brokerageName: 'North Beach Realty' },
    ],
  },
}

// Fallback for unknown ids
export function getMockPropertyDetail(id: string): PropertyDetail {
  return MOCK_PROPERTY_DETAILS[id] ?? { ...MOCK_PROPERTY_DETAILS['1'], id }
}
