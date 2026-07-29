'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Bookmark,
  Share2,
  MessageSquare,
  Volume2,
  VolumeX,
  Pause,
  ChevronUp,
} from 'lucide-react'
import type { Property } from '@/types/search'
import { formatNumber, formatPrice as formatPriceCA, formatLeaseFrequency, realtorHref } from '@/lib/format'
import { logListingClick } from '@/lib/api/analytics'
import { useLeadInquiry } from '@/components/providers/LeadInquiryProvider'
import { STRINGS } from '@/lib/strings'

interface Props {
  property: Property
  isActive: boolean
  viewMode?: 'full' | 'portrait'
  onSave?: (id: string) => void
  isSaved?: boolean
}

// Same fallback used by SearchResultCard — swapped in when a listing's
// third-party image host is dead / hotlink-protected so the card never gets
// stuck on a black background with a hanging image request.
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'

// ─── Right-rail action button ──────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      aria-label={label}
    >
      <div
        className={[
          'w-11 h-11 rounded-full flex items-center justify-center transition-all',
          'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          active ? 'bg-[#1C3829]' : 'bg-black/50 backdrop-blur-sm group-hover:bg-black/70',
        ].join(' ')}
      >
        {icon}
      </div>
      <span className="text-white text-[10px] font-semibold drop-shadow-sm leading-none">
        {label}
      </span>
    </button>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function FeedCard({ property, isActive, viewMode = 'full', onSave, isSaved = false }: Props) {
  const { openInquiry } = useLeadInquiry()
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [imgIndex, setImgIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [saved, setSaved] = useState(isSaved)
  // isSaved often starts false and flips true once SavedPropertiesGate finishes
  // hydrating the saved-ids store after this card has already mounted — keep
  // local state in sync instead of freezing at the initial value.
  useEffect(() => setSaved(isSaved), [isSaved])
  const [videoFailed, setVideoFailed] = useState(false)
  // User-initiated pause of the native video (tap-to-pause). Lets buyers dwell
  // on a frame instead of being carried along by autoplay.
  const [paused, setPaused] = useState(false)
  // Playback position of whichever video is on screen (native or YouTube).
  // Drives the scrubbable seekbar under the bottom info stack.
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 })
  // Bottom info stack starts collapsed to just the address; tapping it reveals
  // price, stats, attribution and the full-listing link.
  const [infoExpanded, setInfoExpanded] = useState(false)

  const images = property.images?.length ? property.images : property.imageUrl ? [property.imageUrl] : []
  const youtubeUrl = property.youtubeUrl ?? null
  // If the native video URL is dead, fall back to the image/YouTube slides.
  const hasVideo = !!property.virtualTourUrl && !videoFailed

  // Full address: street line + "City, Province" on a single line. Falls back
  // gracefully when any part is missing so we never render a stray comma.
  const cityProvince = [property.city, property.province].filter(Boolean).join(', ')
  const streetLine = property.address || cityProvince
  const fullAddress = [property.address, cityProvince].filter(Boolean).join(', ')

  // "3 bd · 4 ba · 1,592 sqft" stats row.
  const statsParts = [
    property.beds > 0 ? `${property.beds} bd` : null,
    property.baths > 0 ? `${property.baths} ba` : null,
    property.sqft > 0 ? `${formatNumber(property.sqft)} sqft` : null,
  ].filter((p): p is string => !!p)

  // "Oakwyn Realty Ltd. · MLS® R3134003" attribution line.
  const attributionLine = [
    property.brokerageName,
    property.mlsNumber ? `MLS® ${property.mlsNumber}` : null,
  ].filter(Boolean).join(' · ')

  // Blurred backdrop source — fills any letterbox gap (esp. on wide desktop
  // viewports) with a soft version of the frame instead of flat black.
  const backdropSrc = images[0] ?? null

  // slides: 0 = YouTube iframe (if present), 1+ = images
  // imgIndex tracks position across all slides
  const totalSlides = (youtubeUrl ? 1 : 0) + images.length
  const isOnYoutube = youtubeUrl ? imgIndex === 0 : false
  const imageSlideIndex = youtubeUrl ? imgIndex - 1 : imgIndex

  // Convert any YouTube URL to an embed URL (controls=0 hides YouTube chrome)
  const youtubeEmbedUrl = useCallback((url: string, active: boolean): string => {
    let id = ''
    try {
      const u = new URL(url)
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1).split('?')[0]
      else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/shorts/')[1].split('?')[0]
      else id = u.searchParams.get('v') ?? ''
    } catch { /* ignore */ }
    return (
      `https://www.youtube.com/embed/${id}` +
      `?autoplay=${active ? 1 : 0}&mute=1&playsinline=1` +
      `&controls=0&disablekb=1&modestbranding=1&rel=0` +
      `&loop=1&playlist=${id}&enablejsapi=1`
    )
  }, [])

  // Send a player command to the YouTube iframe via postMessage
  const sendYoutubeCommand = useCallback((func: 'mute' | 'unMute' | 'seekTo', args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    )
  }, [])

  const toggleYoutubeMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      sendYoutubeCommand(next ? 'mute' : 'unMute')
      return next
    })
  }, [sendYoutubeCommand])

  // Stream playback time out of the YouTube iframe: the "listening" handshake
  // makes the player post `infoDelivery` messages with currentTime/duration,
  // which is what lets the seekbar track (and scrub) an embedded video.
  useEffect(() => {
    if (!isOnYoutube) return
    const listen = () =>
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 'feed-seekbar' }),
        '*',
      )
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        const info = data?.info
        if (typeof info?.currentTime === 'number') {
          // infoDelivery doesn't always carry `duration` — keep the last known
          // one, otherwise the seekbar zeroes out mid-playback.
          setVideoTime((v) => ({
            current: info.currentTime,
            duration: typeof info.duration === 'number' && info.duration > 0 ? info.duration : v.duration,
          }))
        }
      } catch { /* non-JSON message from the player — ignore */ }
    }
    window.addEventListener('message', onMessage)
    listen()
    // The iframe may not have loaded when the effect ran — retry the handshake
    // briefly until the player starts answering.
    const t = setInterval(listen, 1000)
    const stop = setTimeout(() => clearInterval(t), 8000)
    return () => {
      window.removeEventListener('message', onMessage)
      clearInterval(t)
      clearTimeout(stop)
    }
  }, [isOnYoutube, isActive])

  // Scrub whichever video is on screen to a fraction of its duration.
  const seekTo = useCallback((fraction: number) => {
    const duration = hasVideo ? videoRef.current?.duration : videoTime.duration
    if (!duration || !isFinite(duration)) return
    const target = fraction * duration
    if (hasVideo && videoRef.current) {
      videoRef.current.currentTime = target
    } else {
      sendYoutubeCommand('seekTo', [target, true])
    }
    setVideoTime({ current: target, duration })
  }, [hasVideo, videoTime.duration, sendYoutubeCommand])

  // Auto-advance images every 4s when active and showing images (not YouTube slide)
  useEffect(() => {
    if (!isActive || isOnYoutube || hasVideo || images.length <= 1) return
    const t = setInterval(() => setImgIndex((i) => {
      const next = i + 1
      return next >= totalSlides ? (youtubeUrl ? 1 : 0) : next
    }), 4000)
    return () => clearInterval(t)
  }, [isActive, isOnYoutube, hasVideo, images.length, totalSlides, youtubeUrl])

  // Play/pause native video based on active state + user tap-to-pause
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isActive && !paused) { v.play().catch(() => {}) }
    else { v.pause(); if (!isActive) { v.currentTime = 0 } }
  }, [isActive, paused])

  // Reset the manual pause + collapse the info stack whenever this card
  // scrolls out of view, so every card re-enters in its default state.
  useEffect(() => {
    if (!isActive) {
      setPaused(false)
      setInfoExpanded(false)
    }
  }, [isActive])

  const prevImg = useCallback(() => setImgIndex((i) => {
    const prev = i - 1
    return prev < 0 ? totalSlides - 1 : prev
  }), [totalSlides])
  const nextImg = useCallback(() => setImgIndex((i) => {
    const next = i + 1
    return next >= totalSlides ? 0 : next
  }), [totalSlides])

  const handleSave = () => { setSaved((s) => !s); onSave?.(property.id) }

  return (
    <div className={`w-full h-full flex items-center justify-center ${viewMode === 'portrait' ? 'bg-[#FAF9F6]' : ''}`}>

      {/* Card — full bleed or portrait phone shape */}
      <div
        className="relative overflow-hidden bg-[#1a1a1a]"
        style={viewMode === 'portrait' ? {
          width: 'min(390px, calc((100vh - 180px) * 9 / 16))',
          height: 'min(calc(100vh - 180px), calc(min(390px, calc((100vh - 180px) * 9 / 16)) * 16 / 9))',
          borderRadius: '2rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        } : {
          width: '100%',
          height: '100%',
        }}
      >
        {/* Blurred cover backdrop — soft-fills the letterbox gap left by the
            `object-contain` media below, instead of flat black. DDF photos are
            4:3 landscape, so on a portrait feed a cover-crop would show only
            ~39% of the frame's width (and always the same edge). Sits behind
            all media (z-0). */}
        {backdropSrc && (
          <img
            src={backdropSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70 z-0"
            draggable={false}
          />
        )}

        {/* ── Media ─────────────────────────────────── */}
        {hasVideo ? (
          /* Legacy native video (VirtualTourURLBranded) */
          <>
            <video
              ref={videoRef}
              src={property.virtualTourUrl!}
              className="absolute inset-0 w-full h-full object-contain"
              loop muted={muted} playsInline autoPlay={isActive}
              onError={() => setVideoFailed(true)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget
                setVideoTime({ current: v.currentTime, duration: v.duration || 0 })
              }}
            />
            {/* Tap anywhere on the video to pause/resume so buyers can dwell */}
            <button
              onClick={() => setPaused((p) => !p)}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label={paused ? 'Resume video' : 'Pause video'}
            >
              {paused && (
                <span className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Pause size={28} className="text-white fill-white" />
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* YouTube iframe slide — scaled up to bleed outside card so YouTube
                logo (bottom-right) and title bar (top) are off-screen */}
            {youtubeUrl && (
              <div
                className={`absolute transition-opacity duration-300 ${isOnYoutube ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
                style={{ inset: '-10% -2%' }}
              >
                <iframe
                  ref={iframeRef}
                  key={isActive ? 'active' : 'idle'}
                  src={youtubeEmbedUrl(youtubeUrl, isActive && isOnYoutube)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  title="Property video tour"
                />
              </div>
            )}

            {/* Image slides */}
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
                  !isOnYoutube && i === imageSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                draggable={false}
                onError={(e) => {
                  // Dead / hotlink-protected DDF host — swap to the fallback so
                  // the card doesn't sit on a black background forever.
                  const img = e.currentTarget
                  if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE
                }}
              />
            ))}

            {/* Slide progress dots at top */}
            {totalSlides > 1 && (
              <div className="absolute top-3 inset-x-3 z-20 flex gap-1">
                {Array.from({ length: Math.min(totalSlides, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i === imgIndex ? 'bg-white' : 'bg-white/35'}`}
                  />
                ))}
              </div>
            )}

            {/* Tap zones for prev/next (skip when on YouTube so iframe gets touches) */}
            {totalSlides > 1 && !isOnYoutube && (
              <>
                <button onClick={prevImg} className="absolute left-0 top-0 h-full w-1/3 z-10" aria-label="Previous" />
                <button onClick={nextImg} className="absolute right-0 top-0 h-full w-1/3 z-10" aria-label="Next" />
              </>
            )}
            {/* On YouTube slide: narrow right-edge zone to swipe to next image */}
            {totalSlides > 1 && isOnYoutube && (
              <button onClick={nextImg} className="absolute right-0 top-0 h-full w-10 z-30" aria-label="Next" />
            )}

            {/* Fallback image when a listing has no photos or YouTube slide
                (e.g. a video-only listing whose native video failed to load) */}
            {images.length === 0 && !youtubeUrl && (
              <img
                src={FALLBACK_IMAGE}
                alt=""
                className="absolute inset-0 w-full h-full object-contain z-0"
                draggable={false}
              />
            )}
          </>
        )}

        {/* Mute button — at card level (z-40) so it sits above the iframe.
            Top-left, below the floating search bar (mirrors the Phone view
            toggle's offset on the right, which the search bar clears — the
            bar stacks to ~98px below md, hence top-32 there). */}
        {(hasVideo || isOnYoutube) && (
          <button
            onClick={isOnYoutube ? toggleYoutubeMute : () => setMuted((m) => !m)}
            className="absolute top-32 md:top-20 left-3 sm:left-4 z-40 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}

        {/* ── Gradients ─────────────────────────────── */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
        {/* Persistent bottom scrim — keeps price/address ≥4.5:1 legible over any
            underlying video frame, bright or dark. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/55 to-transparent z-10 pointer-events-none" />

        {/* ── Right action rail — utilities only (Save / Share) ─────── */}
        <div className="absolute right-3 bottom-28 z-30 flex flex-col items-center gap-4">
          <ActionBtn
            icon={<Bookmark size={19} className={saved ? 'fill-white text-white' : 'text-white'} />}
            label="Save"
            onClick={handleSave}
            active={saved}
          />

          <ActionBtn
            icon={<Share2 size={19} className="text-white" />}
            label="Share"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: streetLine, url: `/properties/${property.id}` }).catch(() => {})
              }
            }}
          />

          <ActionBtn
            icon={<MessageSquare size={19} className="text-white" />}
            label="Inquire"
            onClick={() =>
              openInquiry({
                listingKey: property.id,
                propertyAddress: fullAddress,
                agentName: property.agentName || property.brokerageName,
              })
            }
          />
        </div>

        {/* CREA "Powered by REALTOR.ca" deep link — bottom right, centred on
            the same column as the Save/Share/Inquire rail above it. */}
        <a
          href={realtorHref(property.realtorUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
            // CREA-05: click-through to the listing on REALTOR.ca is the
            // `Click` event the REAW tier requires us to report.
            logListingClick(property.id)
          }}
          className="absolute right-3 bottom-5 z-30 w-11 flex flex-col items-center text-center text-[9px] text-white/70 hover:text-white transition-colors leading-tight drop-shadow-sm"
        >
          <span className="whitespace-nowrap">{STRINGS.SEARCH_CARD_POWERED_BY}</span>
          <span className="font-semibold whitespace-nowrap">{STRINGS.SEARCH_CARD_REALTOR_CA}</span>
        </a>

        {/* ── Bottom info ───────────────────────────── */}
        {/* pointer-events-none on the box itself: it spans the full card width
            (inset-x-0) and can grow tall enough to sit under the right action
            rail on short viewports, which — tied at the same z-index — would
            otherwise win hit-testing and swallow Save/Share taps. Only the
            actual interactive children opt back in. */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pr-16 pointer-events-none">
          {/* Price — revealed on expand */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              infoExpanded ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <p className="text-white text-2xl font-bold leading-tight mb-1">
              {/* Mirror PropertyCell's guard: DDF omits price on some listings and
                  the search mapper coerces null to 0, so calling formatPrice
                  directly rendered a literal "$0" on live listings. */}
              {property.price > 0
                ? formatPriceCA(property.price)
                : STRINGS.SEARCH_CARD_PRICE_ON_REQUEST}
              {/* JUL21FIX-04: a rent without its period reads as a sale price. */}
              {property.price > 0 && formatLeaseFrequency(property.leaseFrequency) && (
                <span className="text-base font-normal text-white/80">
                  {formatLeaseFrequency(property.leaseFrequency)}
                </span>
              )}
            </p>
          </div>

          {/* Address row — the collapsed state. Tapping it (or the chevron)
              expands/collapses the rest of the info stack. */}
          <button
            onClick={() => setInfoExpanded((e) => !e)}
            aria-expanded={infoExpanded}
            aria-label={infoExpanded ? 'Hide listing details' : 'Show listing details'}
            className="pointer-events-auto flex w-full items-center gap-1.5 text-left"
          >
            <h2 className="text-white text-sm font-medium leading-snug line-clamp-1">
              {fullAddress}
            </h2>
            <ChevronUp
              size={14}
              className={`shrink-0 text-white/70 transition-transform duration-300 ${
                infoExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Details — revealed on expand */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              infoExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-1.5 text-white/85 text-sm mb-1" aria-hidden="true">
              {statsParts.map((part, i) => (
                <span key={i} className="flex items-center gap-x-1.5 whitespace-nowrap">
                  {i > 0 && <span className="text-white/45">·</span>}
                  {part}
                </span>
              ))}
            </div>
            {/* Screen-reader equivalent with expanded, non-abbreviated units */}
            <span className="sr-only">
              {[
                property.beds > 0 ? `${property.beds} bedrooms` : null,
                property.baths > 0 ? `${property.baths} bathrooms` : null,
                property.sqft > 0 ? `${formatNumber(property.sqft)} square feet` : null,
              ].filter(Boolean).join(', ')}
            </span>

            {/* Brokerage + MLS® attribution (Task #4/#5/#8) */}
            {attributionLine && (
              <p className="text-white/55 text-xs leading-snug truncate">{attributionLine}</p>
            )}

            {/* Route back to full listing */}
            <div className="mt-3 pointer-events-auto">
              <Link
                href={`/properties/${property.id}`}
                className="text-white/80 text-xs font-semibold underline underline-offset-2 hover:text-white"
              >
                See full listing
              </Link>
            </div>
          </div>

          {/* Seekbar — video slides only (photos rely on the top slide dots).
              A styled range input so the position is scrubbable: drag/click to
              seek the native video or the YouTube embed. */}
          {(hasVideo || isOnYoutube) && (
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={videoTime.duration ? Math.round((videoTime.current / videoTime.duration) * 1000) : 0}
              onChange={(e) => seekTo(Number(e.target.value) / 1000)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Video progress"
              className={[
                'mt-3 block w-full h-1 appearance-none rounded-full cursor-pointer pointer-events-auto bg-transparent',
                '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow',
                '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full',
                '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0',
              ].join(' ')}
              style={{
                background: `linear-gradient(to right, #4C8C64 ${
                  videoTime.duration ? (videoTime.current / videoTime.duration) * 100 : 0
                }%, rgba(255,255,255,0.25) 0)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
