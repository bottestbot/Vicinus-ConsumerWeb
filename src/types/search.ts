// ─── Property & Search Types ──────────────────────────────────────────────────

export interface Property {
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
  imageUrl: string
  images: string[]
  agentName: string
  agentTitle: string
  brokerageName: string
  mlsNumber: string
  yearBuilt?: number
  parking?: number
  stories?: number
  basement?: boolean
  hoaFee?: number
  matchScore?: number
  isCuratorChoice?: boolean
  description?: string
  features?: string[]
}

export interface SearchFiltersExtended {
  // Basic
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  propertyType: string[]
  status: string
  listingType: string
  minSqft: number | null
  maxSqft: number | null
  // Advanced
  minYearBuilt: number | null
  maxYearBuilt: number | null
  basement: boolean | null
  minStories: number | null
  parking: number | null
  // Listing status
  maxDaysListed: number | null
  hasOpenHouse: boolean
  comingSoon: boolean
  // Financial
  maxMonthlyPayment: number | null
  maxHoaFee: number | null
  // Rental
  petFriendly: boolean
  laundry: boolean
  utilitiesIncluded: boolean
  furnished: boolean
  shortTerm: boolean
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: Partial<SearchFiltersExtended>
  mapBounds?: {
    west: number; south: number; east: number; north: number
  }
  createdAt: string
}

export interface AutocompleteSuggestion {
  id: string
  label: string
  type: 'city' | 'neighbourhood' | 'address' | 'postal'
  subtitle?: string
}

export interface MapPin {
  id: string
  latitude: number
  longitude: number
  price: number
  propertyId: string
}

export type ViewMode = 'list' | 'map' | 'both'

// ─── Mock Data ─────────────────────────────────────────────────────────────────

export const MOCK_PROPERTIES: Property[] = [
  {
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
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'],
    agentName: 'Sarah Chen',
    agentTitle: 'REALTOR®',
    brokerageName: 'Pacific Luxury Realty',
    mlsNumber: 'ML81921234',
    matchScore: 68,
    isCuratorChoice: false,
    description: 'Exceptional Pacific Heights residence offering panoramic views and masterful craftsmanship throughout.',
  },
  {
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
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'],
    agentName: 'Marcus Williams',
    agentTitle: 'REALTOR®',
    brokerageName: 'Bay Area Prestige Homes',
    mlsNumber: 'ML81921235',
    matchScore: 72,
    isCuratorChoice: true,
    description: 'The Glass Pavilion — Experience the seamless transition between indoor fabric and outdoor nature, a masterpiece in the tradition.',
    features: ['Floor-to-ceiling glass', 'Rooftop terrace', 'Smart home', 'Wine cellar'],
  },
  {
    id: '3',
    address: '890 Vallejo Street',
    city: 'San Francisco',
    province: 'CA',
    postalCode: '94133',
    price: 3150000,
    beds: 3,
    baths: 2,
    sqft: 2200,
    propertyType: 'Townhouse',
    status: 'Active',
    listingType: 'For Sale',
    daysOnMarket: 12,
    latitude: 37.8004,
    longitude: -122.4149,
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'],
    agentName: 'Emily Rodriguez',
    agentTitle: 'REALTOR®',
    brokerageName: 'North Beach Realty Group',
    mlsNumber: 'ML81921236',
    matchScore: 55,
    isCuratorChoice: false,
    description: 'Stunning North Beach townhouse with exposed brick and original hardwood floors throughout.',
  },
  {
    id: '4',
    address: '1120 Green Street',
    city: 'San Francisco',
    province: 'CA',
    postalCode: '94133',
    price: 2890000,
    beds: 2,
    baths: 2,
    sqft: 1850,
    propertyType: 'Condominium',
    status: 'Active',
    listingType: 'For Sale',
    daysOnMarket: 5,
    latitude: 37.7994,
    longitude: -122.4181,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'],
    agentName: 'David Park',
    agentTitle: 'REALTOR®',
    brokerageName: 'Pacific Luxury Realty',
    mlsNumber: 'ML81921237',
    matchScore: 61,
    isCuratorChoice: false,
    description: 'Bright and airy Russian Hill condo with city views and private outdoor space.',
  },
  {
    id: '5',
    address: '3340 Washington Street',
    city: 'San Francisco',
    province: 'CA',
    postalCode: '94118',
    price: 7200000,
    beds: 5,
    baths: 6,
    sqft: 5800,
    propertyType: 'Single Family',
    status: 'Active',
    listingType: 'For Sale',
    daysOnMarket: 2,
    latitude: 37.7902,
    longitude: -122.4465,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'],
    agentName: 'Jennifer Liu',
    agentTitle: 'REALTOR®',
    brokerageName: 'Presidio Heights Luxury',
    mlsNumber: 'ML81921238',
    matchScore: 84,
    isCuratorChoice: false,
    description: 'Grand Presidio Heights estate with formal gardens and guesthouse.',
  },
]

export const MOCK_AUTOCOMPLETE: AutocompleteSuggestion[] = [
  { id: '1', label: 'San Francisco', type: 'city', subtitle: 'California' },
  { id: '2', label: 'Pacific Heights', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '3', label: 'North Beach', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '4', label: 'Russian Hill', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '5', label: 'Nob Hill', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '6', label: 'The Castro', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '7', label: 'Presidio Heights', type: 'neighbourhood', subtitle: 'San Francisco, CA' },
  { id: '8', label: 'Vancouver', type: 'city', subtitle: 'British Columbia' },
  { id: '9', label: 'Toronto', type: 'city', subtitle: 'Ontario' },
]

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`
  }
  return `$${price.toLocaleString()}`
}

export function formatFullPrice(price: number): string {
  return `$${price.toLocaleString()}`
}
