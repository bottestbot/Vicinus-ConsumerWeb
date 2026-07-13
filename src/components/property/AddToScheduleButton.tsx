'use client'

// FE-822/823: "Add to schedule" CTA — used on NearbyOpenHouses cards and on a
// listing's own open-house slots (OpenHouseSection), sharing one hook/cache
// so "already scheduled" state stays consistent across both surfaces.
import { useRouter } from 'next/navigation'
import { CalendarPlus, Check } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useAddOpenHouseVisit, useOpenHouseVisits } from '@/hooks/useOpenHouseVisits'

interface AddToScheduleButtonProps {
  openHouseKey: string
  currentListingId: string
  className?: string
}

export default function AddToScheduleButton({ openHouseKey, currentListingId, className }: AddToScheduleButtonProps) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { data: groups } = useOpenHouseVisits()
  const addVisit = useAddOpenHouseVisit()

  const isScheduled = (groups ?? []).some((g) => g.visits.some((v) => v.ddfOpenHouseKey === openHouseKey))

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/properties/${currentListingId}`)
      return
    }
    if (isScheduled || !openHouseKey) return
    addVisit.mutate(openHouseKey)
  }

  return (
    <button
      onClick={handleClick}
      disabled={addVisit.isPending || isScheduled}
      className={`flex items-center gap-1.5 font-bold uppercase tracking-wide rounded-lg transition-colors disabled:cursor-default ${
        isScheduled
          ? 'bg-[#1C3829]/10 text-[#1C3829]'
          : 'bg-[#1C3829] text-white hover:bg-[#2D5A3D] disabled:opacity-60'
      } ${className ?? 'text-[11px] px-3 py-1.5'}`}
    >
      {isScheduled ? <Check size={12} /> : <CalendarPlus size={12} />}
      {isScheduled ? 'Added' : 'Add to schedule'}
    </button>
  )
}
