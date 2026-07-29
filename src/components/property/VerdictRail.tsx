'use client'

// Merge 3 "verdict rail" — the right column of the Life-around section.
// Personalized: match %, reason rows citing real places/distances, caution
// rows. Cold start (signed out / no priorities): area strengths derived from
// the livability breakdown, never a fabricated match. The blended Livability
// score itself is not surfaced — it's held back for now. Client component: the
// personalization fetch (Clerk-gated, never server-cached) hangs off this
// boundary.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import apiClient from '@/lib/api/client'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

type Personalization = NeighbourhoodDetailResponse['personalization']

export interface RailReason {
  /** Bold lead, e.g. "Holland Park 350 m". */
  lead: string
  /** Muted tail, e.g. "parks within a short walk". */
  tail: string
  tone: 'good' | 'warn'
}

interface VerdictRailProps {
  /** Neighbourhood slug — keys the per-user personalization fetch. */
  slug: string
  personalization: Personalization
  /** Cold-start reason rows derived from area data (computed by the section). */
  areaStrengths: RailReason[]
}

function ReasonRow({ reason }: { reason: RailReason }) {
  const warn = reason.tone === 'warn'
  return (
    <div className="flex items-start gap-2.5 text-xs leading-relaxed">
      <span
        className={[
          'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold',
          warn ? 'bg-[#E8C57C] text-[#5B3E08]' : 'bg-[#A3E635] text-[#1C3829]',
        ].join(' ')}
      >
        {warn ? '!' : '✓'}
      </span>
      <p className="text-white/60">
        <span className="font-semibold text-white">{reason.lead}</span>
        {reason.tail && <span> — {reason.tail}</span>}
      </p>
    </div>
  )
}

export default function VerdictRail({
  slug,
  personalization: initial,
  areaStrengths,
}: VerdictRailProps) {
  // The section is server-rendered from a shared cache, so the payload never
  // carries a signed-in user's match — fetch it client-side once Clerk has a
  // session (same contract as WhyItFitsCard on the neighbourhood page).
  const { isSignedIn, isLoaded } = useAuth()
  const [personalization, setPersonalization] = useState<Personalization>(initial)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false
    apiClient
      .get<Personalization>(`/neighbourhoods/${slug}/personalization`)
      .then((res) => {
        if (!cancelled && res.data) setPersonalization(res.data)
      })
      .catch(() => {
        // Cold-start rail stays — never block or blank the section on this.
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, slug])

  const isPersonalized = personalization?.isPersonalized === true
  const signedInNoPriorities = isSignedIn === true && !isPersonalized
  const matchPercent = personalization?.matchPercent ?? 0

  const reasons: RailReason[] = isPersonalized
    ? [
        ...(personalization?.reasonChips ?? []).map<RailReason>((chip) => {
          const [lead, ...rest] = chip.split(' — ')
          return { lead, tail: rest.join(' — '), tone: 'good' }
        }),
        ...(personalization?.cautionChips ?? []).map<RailReason>((chip) => {
          const [lead, ...rest] = chip.split(' — ')
          return { lead, tail: rest.join(' — '), tone: 'warn' }
        }),
      ]
    : areaStrengths

  return (
    <aside className="flex h-full flex-col rounded-2xl bg-[#1C3829] p-6 text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A3E635]">
        ✦ {isPersonalized ? 'For you' : 'This area'}
      </p>

      {isPersonalized ? (
        <p className="mt-2 font-heading text-[44px] font-semibold leading-none text-[#A3E635]">
          {matchPercent}
          <span className="text-lg font-semibold text-white/85">% match</span>
        </p>
      ) : (
        <p className="mt-2 font-heading text-2xl font-semibold leading-snug text-white">
          What stands out here
        </p>
      )}

      <p className="mt-2 text-xs leading-relaxed text-white/70">
        {isPersonalized
          ? 'This home and its area score high on what you filter for, from your saved searches and priorities.'
          : signedInNoPriorities
            ? 'How this pocket scores on the things buyers weigh most. Tell us what matters to you to see your personal match.'
            : 'How this pocket scores on the things buyers weigh most. Set your priorities to see your personal match.'}
      </p>

      {reasons.length > 0 && (
        <div className="mt-4 flex flex-col gap-2.5">
          {reasons.slice(0, 5).map((r, i) => (
            <ReasonRow key={i} reason={r} />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-end justify-end gap-3 border-t border-white/[0.13] pt-3.5">
        <Link
          href={
            isPersonalized || signedInNoPriorities
              ? '/account/priorities'
              : '/sign-up?intent=priorities'
          }
          className="whitespace-nowrap text-[11px] font-semibold text-[#A3E635] hover:underline"
        >
          {isPersonalized ? 'Edit priorities →' : 'Set your priorities →'}
        </Link>
      </div>
    </aside>
  )
}
