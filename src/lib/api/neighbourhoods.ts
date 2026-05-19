import apiClient from './client'

export const getNeighbourhood = (slug: string) => apiClient.get(`/neighbourhoods/${slug}`)
export const getNeighbourhoodListings = (slug: string) => apiClient.get(`/neighbourhoods/${slug}/listings`)
