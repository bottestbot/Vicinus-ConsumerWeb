import apiClient from './client'
import type { AlertsResponse, AlertType } from '@/types/dashboard'

export const getAlerts = (params: { type?: AlertType | AlertType[]; page?: number; limit?: number } = {}) =>
  apiClient.get<AlertsResponse>('/users/me/alerts', {
    params: {
      ...params,
      // Backend accepts a CSV string for multi-type filtering.
      type: Array.isArray(params.type) ? params.type.join(',') : params.type,
    },
  })

export const markAlertRead = (id: string) => apiClient.patch(`/users/me/alerts/${id}`)

export const markAllAlertsRead = () => apiClient.patch<{ count: number }>('/users/me/alerts/read-all')

export const deleteAlert = (id: string) => apiClient.delete(`/users/me/alerts/${id}`)
