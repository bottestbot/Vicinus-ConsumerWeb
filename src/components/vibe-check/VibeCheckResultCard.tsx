'use client'

// Neighbourhood Vibe Check result card (PRD §4 step 3, §10 "the card is the
// shareable unit"). Renders a single VibeCheckResult — swap the mock fixture
// for a real API response later without touching this component.
import Link from 'next/link'
import { Share2, RotateCcw } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { archetypePalette } from './archetype-palette'
import type { VibeCheckResult } from '@/types/vibe-check'

interface Props {
  result: VibeCheckResult
}

export default function VibeCheckResultCard({ result }: Props) {
  const {
    shortId,
    archetypeName,
    tagline,
    matchedNeighbourhood,
    matchPercent,
    reasonChips,
    matchRarityPct,
    runnerUps,
    accentColour,
  } = result

  const palette = archetypePalette[accentColour]
  const [firstWord, ...restWords] = archetypeName.replace(/^The\s+/i, '').split(' ')

  // OG image generation (a parallel task, see PRD §9/§10) is expected to land at
  // this conventional Next.js route-segment path — /vibe/[shortId]/opengraph-image
  // — colocated with src/app/vibe/[shortId]/page.tsx. It may not exist yet, or may
  // land somewhere slightly different, so every fetch of it below is best-effort
  // and wrapped so a miss (404/network/unsupported browser) never blocks sharing.
  const ogImagePath = `/vibe/${shortId}/opengraph-image`

  const buildShareUrl = () => {
    // PRD §9: shared links carry `?ref=<resultId>` for referral attribution — this
    // page's own shortId becomes the referral code for whoever clicks it next.
    // The bare `/vibe/<shortId>` URL (no ref) must keep unfurling identically, so
    // we only ever add the param, never change the path itself.
    if (typeof window === 'undefined') return `/vibe/${shortId}?ref=${shortId}`
    const url = new URL(window.location.href)
    url.searchParams.set('ref', shortId)
    return url.toString()
  }

  const fetchShareImageFile = async () => {
    const response = await fetch(ogImagePath)
    if (!response.ok) return null
    const blob = await response.blob()
    return new File([blob], 'vibe-check.png', { type: blob.type || 'image/png' })
  }

  const handleShare = async () => {
    const shareUrl = buildShareUrl()
    const shareTitle = 'Vicinus Vibe Check'
    const shareText = `I'm ${archetypeName} — ${matchPercent}% match with ${matchedNeighbourhood.name}. What's your vibe?`

    if (typeof navigator !== 'undefined' && navigator.share) {
      // Try to attach the pre-rendered share image (PRD §9: "an image, not just a
      // link"). Any failure here — image not built yet, 404, network error, browser
      // without File-share support — just means we share without it below.
      let shareFile: File | null = null
      try {
        const file = await fetchShareImageFile()
        if (file && navigator.canShare?.({ files: [file] })) {
          shareFile = file
        }
      } catch {
        // OG image unavailable — fall back to the text+url share below.
      }

      try {
        await navigator.share(
          shareFile
            ? { title: shareTitle, text: shareText, url: shareUrl, files: [shareFile] }
            : { title: shareTitle, text: shareText, url: shareUrl }
        )
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // Desktop fallback (PRD §9: "copy image" + "copy link"). Copying the image is
      // a nice-to-have on top of the always-reliable copy-link, not a replacement —
      // if ClipboardItem/image copy isn't supported or the fetch fails, we still
      // fall through to copy-link below.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        try {
          const file = await fetchShareImageFile()
          if (file) {
            await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })])
          }
        } catch {
          // Image clipboard copy unsupported/unavailable — copy-link below still runs.
        }
      }
      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        // Clipboard write blocked — no toast system to fall back to yet.
      }
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#E8E6E1] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo className="text-base" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
          Vibe check
        </span>
      </div>

      <div className="relative mx-5 mt-3 h-40 overflow-visible rounded-xl sm:h-[168px]">
        <div className={`absolute inset-0 rounded-xl ${palette.heroClassName}`} />

        <div className="absolute right-4 top-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#A3E635]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635]/70" />
          <span className="h-1 w-1 rounded-full bg-[#A3E635]/50" />
        </div>

        <span className="absolute left-4 top-4 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {matchedNeighbourhood.name}
        </span>

        <span className="absolute bottom-3 left-4 text-xs text-white/90">
          {matchedNeighbourhood.city}
        </span>

        <div
          className={`absolute -bottom-5 right-4 flex h-[74px] w-[74px] -rotate-[9deg] flex-col items-center justify-center rounded-full border-4 border-white shadow-md ${palette.stampClassName}`}
        >
          <span className="font-heading text-xl font-bold leading-none">{matchPercent}%</span>
          <span className="text-[8px] font-semibold uppercase tracking-widest">Match</span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1C3829]">
          You&apos;re a
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold leading-snug text-[#111111]">
          The{' '}
          <mark className="inline-block -rotate-[1.5deg] rounded bg-[#A3E635] px-1.5 text-[#111111]">
            {firstWord}
          </mark>{' '}
          {restWords.join(' ')}
        </h1>
        <p className="mt-2 text-sm italic leading-relaxed text-[#6B6B6B]">{tagline}</p>
        <p className="mt-3 text-sm text-[#111111]">
          Your match:{' '}
          <span className="font-semibold">
            {matchedNeighbourhood.name}, {matchedNeighbourhood.city}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {reasonChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-1 text-xs font-medium text-[#111111]"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-full bg-[#EDF6DD] px-4 py-2 text-center text-xs font-bold text-[#1C3829]">
          Only {matchRarityPct}% of quiz takers match here
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
            Also fits your vibe
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {runnerUps.map((runnerUp) => (
              <div
                key={runnerUp.name}
                className="flex items-center justify-between rounded-full border border-[#E8E6E1] px-4 py-2"
              >
                <span className="text-sm text-[#111111]">{runnerUp.name}</span>
                <span className="text-sm font-bold text-[#1C3829]">{runnerUp.matchPercent}%</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href={`/sign-up?redirect_url=/vibe/${shortId}`}
          className="mt-5 block text-center text-xs font-semibold text-[#1C3829] underline-offset-2 hover:underline"
        >
          Sign up to unlock 2 more matches →
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#A3E635] px-5 py-2.5 text-sm font-semibold text-[#1C3829] shadow-[0_4px_0_0_#7BB324] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#7BB324] active:translate-y-1 active:shadow-[0_1px_0_0_#7BB324]"
          >
            <Share2 size={15} strokeWidth={2.5} />
            Share
          </button>
          <Link
            href="/vibe"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#E8E6E1] px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:border-[#1C3829] hover:text-[#1C3829]"
          >
            <RotateCcw size={15} strokeWidth={2.5} />
            Retake
          </Link>
        </div>
      </div>
    </div>
  )
}
