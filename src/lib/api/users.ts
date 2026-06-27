import apiClient from './client'

export const getMe = () => apiClient.get('/users/me')
export const getSavedProperties = () => apiClient.get('/users/me/saved')
export const saveProperty = (id: string) => apiClient.post(`/users/me/saved/${id}`)
export const unsaveProperty = (id: string) => apiClient.delete(`/users/me/saved/${id}`)
export const trackVisited = (id: string) => apiClient.post(`/users/me/visited/${id}`)
export const getDashboard = () => apiClient.get('/users/me/dashboard')

export const pingSession = () =>
  apiClient.post<{ loginCount: number; onboardingCompleted: boolean; showOnboarding: boolean }>('/users/me/ping')

export const updateOnboarding = (body: { stepData?: Record<string, unknown>; completed?: boolean }) =>
  apiClient.patch('/users/me/onboarding', body)
