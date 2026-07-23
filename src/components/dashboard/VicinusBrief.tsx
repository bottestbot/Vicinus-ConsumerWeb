'use client'

// BRIEF-09/11: Vicinus IQ Brief — "here's what moved this week" (trailing 7 days).
// Client-only (own fetch + skeleton), mirroring the OpenHouseSchedule pattern so a
// Gemini-backed call never blocks the dashboard's server render (see commit 5530d4d).
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, Home, RefreshCw, Sparkles, TrendingDown } from 'lucide-react'
import { useBrief } from '@/hooks/useBrief'
import type { BriefHighlight, BriefHighlightKind } from '@/types/dashboard'
import { STRINGS } from '@/lib/strings'

interface Props {
  /**
   * Non-fabricated line rendered when the brief is genuinely unavailable (fetch
   * failed, or the payload carried no copy and no highlights). Never an empty box.
   */
  fallback: ReactNode
}

const KIND_ICON: Record<BriefHighlightKind, typeof TrendingDown> = {
  price_drop: TrendingDown,
  new_listing: Home,
  status_change: RefreshCw,
  open_house: CalendarClock,
}

function HighlightChip({ highlight }: { highlight: BriefHighlight }) {
  const Icon = KIND_ICON[highlight.kind] ?? Sparkles

  return (
    <Link
      href={highlight.href}
      className="group inline-flex items-center gap-2 rounded-full border border-[#A3E635]/40 bg-[#A3E635]/10 px-3.5 py-2 text-left transition-colors hover:border-[#A3E635] hover:bg-[#A3E635]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A3E635]"
    >
      <Icon size={15} className="shrink-0 text-[#A3E635]" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[#FAF9F6]">{highlight.label}</span>
        {highlight.subLabel ? (
          <span className="block truncate text-[11px] text-[#FAF9F6]/60">{highlight.subLabel}</span>
        ) : null}
      </span>
      <ArrowRight
        size={13}
        className="shrink-0 text-[#FAF9F6]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#A3E635]"
        aria-hidden="true"
      />
    </Link>
  )
}

function BriefSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={STRINGS.DASHBOARD_BRIEF_LOADING_ARIA}
      className="w-full animate-pulse rounded-2xl border border-[#1C3829] bg-[#1C3829] p-6"
    >
      <div className="mb-4 h-3 w-28 rounded bg-[#FAF9F6]/20" />
      <div className="mb-2.5 h-4 w-3/4 rounded bg-[#FAF9F6]/25" />
      <div className="mb-2 h-3 w-full rounded bg-[#FAF9F6]/15" />
      <div className="mb-5 h-3 w-5/6 rounded bg-[#FAF9F6]/15" />
      <div className="flex gap-2">
        <div className="h-9 w-40 rounded-full bg-[#FAF9F6]/10" />
        <div className="h-9 w-40 rounded-full bg-[#FAF9F6]/10" />
      </div>
      <span className="sr-only">{STRINGS.DASHBOARD_BRIEF_LOADING_ARIA}</span>
    </div>
  )
}

export default function VicinusBrief({ fallback }: Props) {
  const { data: brief, isLoading, isError } = useBrief()

  // Live-updating region: announce loading and content swaps politely, but never
  // let a failed/slow brief break the rest of the dashboard render.
  if (isLoading) {
    return (
      <div aria-live="polite">
        <BriefSkeleton />
      </div>
    )
  }

  const headline = brief?.headline?.trim()
  const body = brief?.body?.trim()
  const highlights = brief?.highlights ?? []
  const hasContent = Boolean(headline || body || highlights.length > 0)

  // Hard failure, or an empty payload with nothing to say → honest fallback line.
  // Never render an empty green box (BRIEF-11).
  if (isError || !brief || !hasContent) {
    return <div aria-live="polite">{fallback}</div>
  }

  return (
    <section
      aria-label={STRINGS.DASHBOARD_BRIEF_REGION_LABEL}
      aria-live="polite"
      className="w-full rounded-2xl border border-[#1C3829] bg-[#1C3829] p-6 text-[#FAF9F6]"
    >
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#A3E635]">
        <Sparkles size={13} aria-hidden="true" />
        {STRINGS.DASHBOARD_BRIEF_EYEBROW}
      </p>

      {headline ? (
        <h2 className="font-heading text-xl font-semibold leading-snug text-[#FAF9F6] sm:text-2xl">
          {headline}
        </h2>
      ) : null}

      {body ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#FAF9F6]/80">{body}</p> : null}

      {highlights.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {highlights.map((h) => (
            <HighlightChip key={h.id} highlight={h} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
