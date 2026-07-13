import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOpenHouseVisit,
  getOpenHouseVisits,
  removeOpenHouseVisit,
  updateOpenHouseVisitStatus,
} from '@/lib/api/openHouseVisits'
import type { OpenHouseVisitGroup, OpenHouseVisitStatus } from '@/types/dashboard'

export const OPEN_HOUSE_VISITS_KEY = ['open-house-visits'] as const

export function useOpenHouseVisits() {
  return useQuery({
    queryKey: OPEN_HOUSE_VISITS_KEY,
    queryFn: () => getOpenHouseVisits().then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useAddOpenHouseVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ddfOpenHouseKey: string) => addOpenHouseVisit(ddfOpenHouseKey),
    onSettled: () => qc.invalidateQueries({ queryKey: OPEN_HOUSE_VISITS_KEY }),
  })
}

export function useUpdateOpenHouseVisitStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, status }: { key: string; status: OpenHouseVisitStatus }) =>
      updateOpenHouseVisitStatus(key, status),
    onMutate: async ({ key, status }) => {
      await qc.cancelQueries({ queryKey: OPEN_HOUSE_VISITS_KEY })
      const previous = qc.getQueryData<OpenHouseVisitGroup[]>(OPEN_HOUSE_VISITS_KEY)
      if (previous) {
        qc.setQueryData<OpenHouseVisitGroup[]>(
          OPEN_HOUSE_VISITS_KEY,
          previous.map((group) => ({
            ...group,
            visits: group.visits.map((v) => (v.ddfOpenHouseKey === key ? { ...v, status } : v)),
          })),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(OPEN_HOUSE_VISITS_KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: OPEN_HOUSE_VISITS_KEY }),
  })
}

export function useRemoveOpenHouseVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => removeOpenHouseVisit(key),
    onMutate: async (key: string) => {
      await qc.cancelQueries({ queryKey: OPEN_HOUSE_VISITS_KEY })
      const previous = qc.getQueryData<OpenHouseVisitGroup[]>(OPEN_HOUSE_VISITS_KEY)
      if (previous) {
        qc.setQueryData<OpenHouseVisitGroup[]>(
          OPEN_HOUSE_VISITS_KEY,
          previous
            .map((group) => ({ ...group, visits: group.visits.filter((v) => v.ddfOpenHouseKey !== key) }))
            .filter((group) => group.visits.length > 0),
        )
      }
      return { previous }
    },
    onError: (_err, _key, ctx) => {
      if (ctx?.previous) qc.setQueryData(OPEN_HOUSE_VISITS_KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: OPEN_HOUSE_VISITS_KEY }),
  })
}
