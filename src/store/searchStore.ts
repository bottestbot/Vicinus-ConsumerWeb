import { create } from 'zustand'

interface SearchFilters {
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  propertyType: string[]
  status: string
  minSqft: number | null
  maxSqft: number | null
}

interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

interface SearchStore {
  query: string
  filters: SearchFilters
  viewMode: 'list' | 'map' | 'both'
  mapBounds: MapBounds | null
  setQuery: (q: string) => void
  setFilter: (key: keyof SearchFilters, value: unknown) => void
  resetFilters: () => void
  setViewMode: (m: 'list' | 'map' | 'both') => void
  setMapBounds: (b: MapBounds) => void
}

const defaultFilters: SearchFilters = {
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  propertyType: [],
  status: 'Active',
  minSqft: null,
  maxSqft: null,
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  filters: defaultFilters,
  viewMode: 'both',
  mapBounds: null,
  setQuery: (q) => set({ query: q }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setViewMode: (m) => set({ viewMode: m }),
  setMapBounds: (b) => set({ mapBounds: b }),
}))
