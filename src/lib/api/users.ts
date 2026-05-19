import apiClient from './client'

export const getMe = () => apiClient.get('/users/me')
export const getSavedProperties = () => apiClient.get('/users/me/saved')
export const saveProperty = (id: string) => apiClient.post(`/users/me/saved/${id}`)
export const unsaveProperty = (id: string) => apiClient.delete(`/users/me/saved/${id}`)
export const trackVisited = (id: string) => apiClient.post(`/users/me/visited/${id}`)
export const getDashboard = () => apiClient.get('/users/me/dashboard')
