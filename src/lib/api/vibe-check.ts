// Neighbourhood Vibe Check quiz — thin wrappers around the matching-engine API
// being built in parallel (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §5-§6, §8). Mirrors
// the convention in src/lib/api/users.ts: one function per endpoint, apiClient
// handles baseURL + auth header. Types here describe only what the quiz UI
// consumes (id/text) — dimensionDeltas/flavorDeltas stay server-side.
import apiClient from './client'
import type { VibeCheckResult } from '@/types/vibe-check'

export interface VibeCheckQuestionOption {
  id: string
  text: string
}

export interface VibeCheckQuestion {
  id: string
  text: string
  options: VibeCheckQuestionOption[]
}

export const getVibeCheckQuestions = () =>
  apiClient.get<VibeCheckQuestion[]>('/vibe-check/questions')

export interface SubmitVibeCheckPayload {
  answerIds: string[]
  sessionId: string
  referredByShortId?: string
}

export const submitVibeCheck = (payload: SubmitVibeCheckPayload) =>
  apiClient.post<VibeCheckResult>('/vibe-check/submit', payload)
