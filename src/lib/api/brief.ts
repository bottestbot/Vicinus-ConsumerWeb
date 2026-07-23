import apiClient from './client'
import type { Brief } from '@/types/dashboard'

/** GET the personalized Vicinus IQ Brief for the signed-in user (BRIEF-06). */
export const getBrief = () => apiClient.get<Brief>('/users/me/brief')
