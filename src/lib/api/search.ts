import apiClient from './client'

export const searchProperties = (params: Record<string, unknown>) => apiClient.get('/search', { params })
export const getMapPins = (bbox: string) => apiClient.get('/search/map-pins', { params: { bbox } })
