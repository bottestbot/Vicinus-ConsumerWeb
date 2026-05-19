import apiClient from './client'

export const getProperty = (id: string) => apiClient.get(`/properties/${id}`)
export const getProperties = (params?: Record<string, unknown>) => apiClient.get('/properties', { params })
