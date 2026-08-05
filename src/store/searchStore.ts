import { create } from 'zustand'
import type { ListingType, SearchFiltersExtended, SavedSearch, ViewMode } from '@/types/search'
import { saveSearch as saveSearchApi, getSavedSearches, deleteSavedSearch } from '@/lib/api/search'
import { filtersToSearchParams } from '@/lib/searchFilters'

interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

interface SearchStore {
  // Query & filters
  query: string
  // Set only when `query` came from picking an autocomplete suggestion — the
  // suggestion's real DDF-queryable city (e.g. "Surrey" for "South Surrey"),
  // since a neighbourhood/community name never matches DDF's `City` field on
  // its own. Cleared whenever the user types free text instead of selecting.
  selectedCity: string | null
  filters: SearchFiltersExtended
  viewMode: ViewMode

  // Map state
  mapBounds: MapBounds | null
  mapCenter: { longitude: number; latitude: number; zoom: number }
  // `zoom` lets a full street-address geocode zoom in tighter than a city-level one.
  geocodedCenter: { longitude: number; latitude: number; zoom?: number } | null
  // City the map is currently panned to (reverse-geocoded, debounced on
  // moveend) — "wherever the user is currently browsing". Drives the
  // Feed/location label so Map↔Feed stays in sync. Since device geolocation was
  // removed, this is the only source of a user-facing city.
  mapCity: string | null

  // UI state
  hoveredPropertyId: string | null
  selectedPropertyId: string | null

  // Saved searches
  savedSearches: SavedSearch[]

  // Actions
  setQuery: (q: string) => void
  setSelectedCity: (city: string | null) => void
  setFilter: <K extends keyof SearchFiltersExtended>(key: K, value: SearchFiltersExtended[K]) => void
  resetFilters: () => void
  setViewMode: (m: ViewMode) => void
  setMapBounds: (b: MapBounds) => void
  setMapCenter: (c: { longitude: number; latitude: number; zoom: number }) => void
  setGeocodedCenter: (c: { longitude: number; latitude: number; zoom?: number } | null) => void
  setMapCity: (city: string | null) => void
  setHoveredProperty: (id: string | null) => void
  setSelectedProperty: (id: string | null) => void
  /** `listingType` comes from the route (/buy vs /rent), not from filter
   *  state — the store has no idea which one the user is on, and a saved rent
   *  search MUST persist "For Rent" or the backend alert matcher treats it as
   *  a sale search (saved-search-matcher.util.ts defaults to "For Sale"). */
  saveSearch: (name: string, listingType: ListingType) => Promise<void>
  removeSavedSearch: (id: string) => Promise<void>
  loadSavedSearches: () => Promise<void>
}

const defaultFilters: SearchFiltersExtended = {
  // Basic
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  bedsBathsExact: false,
  propertyType: [],
  structureType: [],
  status: 'Active',
  minSqft: null,
  maxSqft: null,
  // Advanced
  minYearBuilt: null,
  maxYearBuilt: null,
  basement: null,
  parking: null,
  // Listing status
  maxDaysListed: null,
  hasOpenHouse: false,
  comingSoon: false,
  // Rental
  petFriendly: false,
  laundry: false,
  utilitiesIncluded: false,
  furnished: false,
  shortTerm: false,
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  selectedCity: null,
  filters: defaultFilters,
  viewMode: 'both', // Search opens on the Map (split-pane) by default; 'list' = Feed.
  mapBounds: null,
  // Vancouver is the map's home position. It used to be a fallback that device
  // geolocation overwrote, but we no longer ask the browser for location — an
  // unprompted permission dialog on first load was a poor first impression —
  // so this is now simply where the map starts.
  mapCenter: { longitude: -123.1207, latitude: 49.2827, zoom: 11 },
  geocodedCenter: null,
  mapCity: null,
  hoveredPropertyId: null,
  selectedPropertyId: null,
  savedSearches: [],

  setQuery: (q) => set({ query: q }),

  setSelectedCity: (city) => set({ selectedCity: city }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  resetFilters: () => set({ filters: defaultFilters }),

  setViewMode: (m) => set({ viewMode: m }),

  setMapBounds: (b) => set({ mapBounds: b }),

  setMapCenter: (c) => set({ mapCenter: c }),

  setGeocodedCenter: (c) => set({ geocodedCenter: c }),

  setMapCity: (city) => set({ mapCity: city }),

  setHoveredProperty: (id) => set({ hoveredPropertyId: id }),

  setSelectedProperty: (id) => set({ selectedPropertyId: id }),

  saveSearch: async (name, listingType) => {
    const state = get()
    const filters = filtersToSearchParams(state.filters, state.query, listingType)
    const res = await saveSearchApi({ name, filters })
    const saved = res.data as { id: string; name: string | null; filters: unknown; createdAt: string }
    const search: SavedSearch = {
      id: saved.id,
      name: saved.name ?? name,
      filters: saved.filters as SavedSearch['filters'],
      createdAt: saved.createdAt,
    }
    set((s) => ({ savedSearches: [...s.savedSearches, search] }))
  },

  removeSavedSearch: async (id) => {
    await deleteSavedSearch(id)
    set((s) => ({ savedSearches: s.savedSearches.filter((ss) => ss.id !== id) }))
  },

  loadSavedSearches: async () => {
    try {
      const res = await getSavedSearches()
      const data = Array.isArray(res.data) ? (res.data as SavedSearch[]) : []
      set({ savedSearches: data })
    } catch {
      // Non-fatal — the dropdown just stays empty until the next successful load.
    }
  },
}))
