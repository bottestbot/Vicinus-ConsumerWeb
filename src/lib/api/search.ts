import apiClient from './client'
import type { SearchFiltersExtended } from '@/types/search'

export const searchProperties = (params: Partial<SearchFiltersExtended> & {
  q?: string
  bbox?: string
  page?: number
  limit?: number
}) => apiClient.get('/search', { params })

export const getMapPins = (bbox: string) =>
  apiClient.get('/search/map-pins', { params: { bbox } })

export const saveSearch = (body: {
  name: string
  query: string
  filters: Partial<SearchFiltersExtended>
  mapBounds?: { west: number; south: number; east: number; north: number }
}) => apiClient.post('/users/me/searches', body)

export const getSavedSearches = () =>
  apiClient.get('/users/me/searches')

export const deleteSavedSearch = (id: string) =>
  apiClient.delete(`/users/me/searches/${id}`)

export const getAutocomplete = (q: string) =>
  apiClient.get('/search/autocomplete', { params: { q } })
