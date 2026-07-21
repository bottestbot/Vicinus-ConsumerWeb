'use client'

// NBHD-D05 — "Why {name} fits you" AI card. Forest-bordered card with a sparkle
// icon, match % badge, a personalized sentence, green reason chips + amber caution
// chips, and an "Edit priorities" control. Falls back to a cold-start variant
// (derived area strengths, "Set your priorities" CTA) for signed-out / no-data users.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Sparkles, Check, AlertTriangle } from 'lucide-react'
import apiClient from '@/lib/api/client'
import type { NeighbourhoodDetailResponse } from '@/types/neighbourhood-detail'

type Personalization = NeighbourhoodDetailResponse['personalization']

interface Props {
  name: string
  slug: string
  personalization: Personalization
}

export default function WhyItFitsCard({ name, slug, personalization: initial }: Props) {
  // The detail payload is server-rendered and shared-cached, so it never
  // carries a signed-in user's match. Fetch it client-side once Clerk has a
  // session, using the interceptor that attaches the bearer token.
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
        // Leave the cold-start variant in place — never block the card on this.
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, slug])

  const isPersonalized = personalization?.isPersonalized === true
  const reasonChips = personalization?.reasonChips ?? []
  const cautionChips = personalization?.cautionChips ?? []
  const matchPercent = personalization?.matchPercent ?? 0

  // Three states, not two: anonymous, signed in without priorities, and
  // personalized. Signed-in users were previously told to "sign in", because
  // the card only distinguished personalized from everything else.
  const signedInNoPriorities = isSignedIn === true && !isPersonalized

  const heading = isPersonalized ? `Why ${name} fits you` : `What stands out in ${name}`
  const subtitle = isPersonalized
    ? 'From your saved searches and priorities'
    : signedInNoPriorities
      ? 'Set your priorities for a personalized match'
      : 'Sign in for your personalized match'

  const sentence = isPersonalized
    ? `Based on your saved searches and priorities, ${name} is a ${matchPercent}% match — it scores high on the things you filter for.`
    : signedInNoPriorities
      ? `Here's what makes ${name} stand out. Tell us what matters to you and we'll show how well it matches.`
      : `Here's what makes ${name} stand out. Sign in and set your priorities to see how well it matches what you're looking for.`

  return (
    <section className="mt-8 rounded-2xl border-2 border-[#1C3829] bg-[#F5F7F0] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1C3829]">
            <Sparkles size={17} className="text-[#A3E635]" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#111111]">{heading}</h2>
            <p className="text-xs text-[#6B6B6B]">{subtitle}</p>
          </div>
        </div>
        {isPersonalized && (
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-[#EAF7D9] px-3.5 py-1.5">
            <span className="font-heading text-xl font-semibold leading-none text-[#1C3829]">
              {matchPercent}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#1C3829]/70">
              Match
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#333333]">{sentence}</p>

      {(reasonChips.length > 0 || cautionChips.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {reasonChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#A3E635]/50 bg-[#EDF6DD] px-3 py-1 text-xs font-medium text-[#1C3829]"
            >
              <Check size={13} strokeWidth={2.5} className="text-[#1C7A3F]" />
              {chip}
            </span>
          ))}
          {cautionChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E4B87A]/50 bg-[#FBF1E4] px-3 py-1 text-xs font-medium text-[#8A5A20]"
            >
              <AlertTriangle size={13} strokeWidth={2.5} className="text-[#C08A3E]" />
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link
          href={isPersonalized ? '/account/priorities' : '/sign-up?intent=priorities'}
          className="text-xs font-semibold text-[#1C3829] underline-offset-2 hover:underline"
        >
          {isPersonalized ? 'Edit priorities' : 'Set your priorities →'}
        </Link>
      </div>
    </section>
  )
}
