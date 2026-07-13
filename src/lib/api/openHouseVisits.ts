import apiClient from './client'
import type { OpenHouseVisit, OpenHouseVisitGroup, OpenHouseVisitStatus } from '@/types/dashboard'

export const getOpenHouseVisits = () => apiClient.get<OpenHouseVisitGroup[]>('/users/me/open-house-visits')

export const addOpenHouseVisit = (ddfOpenHouseKey: string) =>
  apiClient.post<OpenHouseVisit>(`/users/me/open-house-visits/${ddfOpenHouseKey}`)

export const updateOpenHouseVisitStatus = (ddfOpenHouseKey: string, status: OpenHouseVisitStatus) =>
  apiClient.patch<OpenHouseVisit>(`/users/me/open-house-visits/${ddfOpenHouseKey}`, { status })

export const removeOpenHouseVisit = (ddfOpenHouseKey: string) =>
  apiClient.delete(`/users/me/open-house-visits/${ddfOpenHouseKey}`)
