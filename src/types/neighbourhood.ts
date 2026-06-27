export type EssentialCategory = 'education' | 'healthcare' | 'parks' | 'childcare'

export interface Neighbourhood {
  slug: string
  name: string
  city: string
  province: string
  bio?: string
  imageUrl?: string
  photos?: string[]
  medianPrice?: number
  walkScore?: number
  transitScore?: number
  schoolGrade?: string
  lat?: number
  lng?: number
}

export interface Essential {
  id: string
  name: string
  category: EssentialCategory
  distance: string
}

export interface NeighbourhoodAgent {
  id: string
  name: string
  title: string
  photoUrl?: string
  phone?: string
  email?: string
  listingsCount?: number
}

export interface NeighbourhoodListing {
  id: string
  address: string
  price: number
  beds: number
  baths: number
  imageUrl: string
  agentName?: string
  brokerageName?: string
  mlsNumber?: string
}
