import apiClient from './client'
import type { AlertsResponse, AlertType } from '@/types/dashboard'

export const getAlerts = (params: { type?: AlertType; page?: number; limit?: number } = {}) =>
  apiClient.get<AlertsResponse>('/users/me/alerts', { params })

export const markAlertRead = (id: string) => apiClient.patch(`/users/me/alerts/${id}`)

export const markAllAlertsRead = () => apiClient.patch<{ count: number }>('/users/me/alerts/read-all')
