import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryKey } from '@tanstack/react-query'
import { getAlerts, markAlertRead, markAllAlertsRead, deleteAlert } from '@/lib/api/alerts'
import type { AlertsResponse, AlertType } from '@/types/dashboard'

export const ALERTS_PAGE_SIZE = 10

/** Base key mutations invalidate/optimistically update against — matches
 *  every type-filtered, every-page variant below since React Query key
 *  matching is prefix-based, so `['alerts']` matches `['alerts', 1]`,
 *  `['alerts', ['NEW_LISTING', ...], 2]`, etc. */
const ALERTS_KEY = ['alerts'] as const

/** The "All" tab passes no type filter; the "Alerts" tab passes an explicit
 *  list of non-OPEN_HOUSE types so it gets its own server-side-filtered,
 *  independently-paginated feed instead of client-side-filtering whatever
 *  page the "All" tab happens to have loaded. `page` is 1-indexed and driven
 *  by numbered pagination controls in the UI — each (type, page) pair is its
 *  own cached query, with `keepPreviousData` so switching pages doesn't flash
 *  a loading state. */
export function useAlerts(page: number, type?: AlertType | AlertType[]) {
  return useQuery({
    queryKey: type ? [...ALERTS_KEY, type, page] : [...ALERTS_KEY, page],
    queryFn: () => getAlerts({ type, limit: ALERTS_PAGE_SIZE, page }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

/** A given alert can be visible in the "All" cache, the "Alerts" cache, and
 *  more than one cached page simultaneously — find it in whichever cached
 *  page has it. */
function findAlert(entries: [QueryKey, AlertsResponse | undefined][], id: string) {
  for (const [, data] of entries) {
    const found = data?.alerts.find((a) => a.id === id)
    if (found) return found
  }
  return undefined
}

function restore(qc: ReturnType<typeof useQueryClient>, previous?: [QueryKey, AlertsResponse | undefined][]) {
  previous?.forEach(([key, data]) => qc.setQueryData(key, data))
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markAlertRead(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY })
      const alreadyRead = findAlert(previous, id)?.readAt != null
      qc.setQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY }, (old) =>
        old
          ? {
              ...old,
              alerts: old.alerts.map((a) => (a.id === id ? { ...a, readAt: a.readAt ?? new Date().toISOString() } : a)),
              unreadCount: alreadyRead ? old.unreadCount : Math.max(0, old.unreadCount - 1),
            }
          : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => restore(qc, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}

export function useDeleteAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY })
      const removed = findAlert(previous, id)
      qc.setQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY }, (old) =>
        old
          ? {
              ...old,
              alerts: old.alerts.filter((a) => a.id !== id),
              total: Math.max(0, old.total - 1),
              unreadCount: removed && !removed.readAt ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
            }
          : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => restore(qc, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllAlertsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY })
      const previous = qc.getQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY })
      // markAllRead deletes every alert server-side (see alerts.service.ts) —
      // collapse every cached page (every tab, every page number) down to an
      // empty page rather than mapping over the old one, since none of them
      // exist anymore.
      qc.setQueriesData<AlertsResponse>({ queryKey: ALERTS_KEY }, (old) =>
        old ? { alerts: [], total: 0, unreadCount: 0 } : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => restore(qc, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  })
}
