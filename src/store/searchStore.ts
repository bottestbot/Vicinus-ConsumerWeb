import { create } from 'zustand'
import type { SearchFiltersExtended, SavedSearch, ViewMode } from '@/types/search'

interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

interface SearchStore {
  // Query & filters
  query: string
  filters: SearchFiltersExtended
  viewMode: ViewMode

  // User location (set once on app load via geolocation)
  userCity: string | null
  userCoords: { latitude: number; longitude: number } | null

  // Map state
  mapBounds: MapBounds | null
  mapCenter: { longitude: number; latitude: number; zoom: number }
  geocodedCenter: { longitude: number; latitude: number } | null

  // UI state
  hoveredPropertyId: string | null
  selectedPropertyId: string | null

  // Saved searches
  savedSearches: SavedSearch[]

  // Actions
  setQuery: (q: string) => void
  setFilter: <K extends keyof SearchFiltersExtended>(key: K, value: SearchFiltersExtended[K]) => void
  resetFilters: () => void
  setViewMode: (m: ViewMode) => void
  setMapBounds: (b: MapBounds) => void
  setMapCenter: (c: { longitude: number; latitude: number; zoom: number }) => void
  setGeocodedCenter: (c: { longitude: number; latitude: number } | null) => void
  setUserLocation: (city: string | null, coords: { latitude: number; longitude: number } | null) => void
  setHoveredProperty: (id: string | null) => void
  setSelectedProperty: (id: string | null) => void
  saveSearch: (name: string) => void
  removeSavedSearch: (id: string) => void
}

const defaultFilters: SearchFiltersExtended = {
  // Basic
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  propertyType: [],
  structureType: [],
  status: 'Active',
  listingType: 'For Sale',
  minSqft: null,
  maxSqft: null,
  // Advanced
  minYearBuilt: null,
  maxYearBuilt: null,
  basement: null,
  minStories: null,
  parking: null,
  // Listing status
  maxDaysListed: null,
  hasOpenHouse: false,
  comingSoon: false,
  // Financial
  maxMonthlyPayment: null,
  maxHoaFee: null,
  // Rental
  petFriendly: false,
  laundry: false,
  utilitiesIncluded: false,
  furnished: false,
  shortTerm: false,
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  filters: defaultFilters,
  viewMode: 'both',
  userCity: null,
  userCoords: null,
  mapBounds: null,
  // Default fallback = Vancouver (BUG-03). LocationProvider overwrites this with
  // the user's own location once geolocation resolves; Vancouver is only used
  // when geolocation is unavailable/denied.
  mapCenter: { longitude: -123.1207, latitude: 49.2827, zoom: 11 },
  geocodedCenter: null,
  hoveredPropertyId: null,
  selectedPropertyId: null,
  savedSearches: [],

  setQuery: (q) => set({ query: q }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  resetFilters: () => set({ filters: defaultFilters }),

  setViewMode: (m) => set({ viewMode: m }),

  setMapBounds: (b) => set({ mapBounds: b }),

  setMapCenter: (c) => set({ mapCenter: c }),

  setGeocodedCenter: (c) => set({ geocodedCenter: c }),

  setUserLocation: (city, coords) => set({ userCity: city, userCoords: coords }),

  setHoveredProperty: (id) => set({ hoveredPropertyId: id }),

  setSelectedProperty: (id) => set({ selectedPropertyId: id }),

  saveSearch: (name) => {
    const state = get()
    const search: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: state.query,
      filters: state.filters,
      mapBounds: state.mapBounds ?? undefined,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ savedSearches: [...s.savedSearches, search] }))
  },

  removeSavedSearch: (id) =>
    set((s) => ({ savedSearches: s.savedSearches.filter((ss) => ss.id !== id) })),
}))
