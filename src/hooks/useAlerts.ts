import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts, markAlertRead, markAllAlertsRead, deleteAlert } from '@/lib/api/alerts'
import type { AlertsResponse } from '@/types/dashboard'

const ALERTS_KEY = ['alerts'] as const

export function useAlerts() {
  return useQuery({
    queryKey: ALERTS_KEY,
    queryFn: () => getAlerts({ limit: 20 }).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markAlertRead(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueryData<AlertsResponse>(ALERTS_KEY)
      if (previous) {
        const alreadyRead = previous.alerts.find((a) => a.id === id)?.readAt != null
        qc.setQueryData<AlertsResponse>(ALERTS_KEY, {
          ...previous,
          alerts: previous.alerts.map((a) => (a.id === id ? { ...a, readAt: a.readAt ?? new Date().toISOString() } : a)),
          unreadCount: alreadyRead ? previous.unreadCount : Math.max(0, previous.unreadCount - 1),
        })
      }
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(ALERTS_KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}

export function useDeleteAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueryData<AlertsResponse>(ALERTS_KEY)
      if (previous) {
        const removed = previous.alerts.find((a) => a.id === id)
        qc.setQueryData<AlertsResponse>(ALERTS_KEY, {
          ...previous,
          alerts: previous.alerts.filter((a) => a.id !== id),
          total: Math.max(0, previous.total - 1),
          unreadCount: removed && !removed.readAt ? Math.max(0, previous.unreadCount - 1) : previous.unreadCount,
        })
      }
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(ALERTS_KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllAlertsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueryData<AlertsResponse>(ALERTS_KEY)
      if (previous) {
        qc.setQueryData<AlertsResponse>(ALERTS_KEY, {
          ...previous,
          alerts: [],
          total: 0,
          unreadCount: 0,
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ALERTS_KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}
