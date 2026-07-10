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
} from 'lucide-react'
import type { Property } from '@/types/search'
import { formatNumber, formatPrice as formatPriceCA } from '@/lib/format'

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

function formatPrice(p: number): string {
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(p % 1_000_000 === 0 ? 0 : 2)}M`
  if (p >= 1_000) return `$${(p / 1_000).toFixed(0)}K`
  return formatPriceCA(p)
}

function deriveTags(property: Property): string[] {
  const tags: string[] = []
  if (property.propertyType) tags.push(property.propertyType)
  if (property.features?.length) tags.push(...property.features.slice(0, 2))
  const desc = (property.description ?? '').toLowerCase()
  if (desc.includes('pool') || desc.includes('infinity')) tags.push('Pool')
  if (desc.includes('smart home') || desc.includes('smart-home')) tags.push('Smart Home')
  if (desc.includes('penthouse')) tags.push('Penthouse')
  if (desc.includes('waterfront')) tags.push('Waterfront')
  if (desc.includes('mountain')) tags.push('Mountain View')
  return [...new Set(tags)].slice(0, 3)
}

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [imgIndex, setImgIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [saved, setSaved] = useState(isSaved)
  const [videoFailed, setVideoFailed] = useState(false)
  // User-initiated pause of the native video (tap-to-pause). Lets buyers dwell
  // on a frame instead of being carried along by autoplay.
  const [paused, setPaused] = useState(false)

  const images = property.images?.length ? property.images : property.imageUrl ? [property.imageUrl] : []
  const youtubeUrl = property.youtubeUrl ?? null
  // If the native video URL is dead, fall back to the image/YouTube slides.
  const hasVideo = !!property.virtualTourUrl && !videoFailed
  const tags = deriveTags(property)

  // Full address: street line + "City, Province". Falls back gracefully when
  // any part is missing so we never render a stray comma or empty line.
  const cityProvince = [property.city, property.province].filter(Boolean).join(', ')
  const streetLine = property.address || cityProvince
  const showCityLine = !!property.address && !!cityProvince

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

  // Send mute/unmute command to the YouTube iframe via postMessage
  const sendYoutubeCommand = useCallback((func: 'mute' | 'unMute') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
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

  // Reset the manual pause whenever this card scrolls out of view.
  useEffect(() => { if (!isActive) setPaused(false) }, [isActive])

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
        {/* Blurred cover backdrop — soft-fills any letterbox gap instead of
            flat black on wide viewports. Sits behind all media (z-0). */}
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
              className="absolute inset-0 w-full h-full object-cover"
              loop muted={muted} playsInline autoPlay={isActive}
              onError={() => setVideoFailed(true)}
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
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
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
                className="absolute inset-0 w-full h-full object-cover z-0"
                draggable={false}
              />
            )}
          </>
        )}

        {/* Mute button — at card level (z-40) so it sits above the iframe */}
        {(hasVideo || isOnYoutube) && (
          <button
            onClick={isOnYoutube ? toggleYoutubeMute : () => setMuted((m) => !m)}
            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white"
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
        <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
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
        </div>

        {/* ── Bottom info ───────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pr-16">
          <Link href={`/properties/${property.id}`} className="block group mb-1">
            <h2 className="font-heading text-white text-lg font-semibold leading-snug group-hover:underline line-clamp-1">
              {streetLine}
            </h2>
            {showCityLine && (
              <p className="text-white/80 text-sm font-medium leading-snug line-clamp-1">
                {cityProvince}
              </p>
            )}
          </Link>

          <p className="text-white text-xl font-bold mb-2 mt-1">
            {formatPrice(property.price)}
          </p>

          <div className="flex items-center gap-2.5 text-white/90 text-xs font-semibold mb-2.5" aria-hidden="true">
            {property.beds > 0 && <span>{property.beds} BD</span>}
            {property.beds > 0 && property.baths > 0 && <span className="text-white/40">|</span>}
            {property.baths > 0 && <span>{property.baths} BA</span>}
            {property.sqft > 0 && (
              <><span className="text-white/40">|</span><span>{formatNumber(property.sqft)} SQFT</span></>
            )}
          </div>
          {/* Screen-reader equivalent with expanded, non-abbreviated units */}
          <span className="sr-only">
            {[
              property.beds > 0 ? `${property.beds} bedrooms` : null,
              property.baths > 0 ? `${property.baths} bathrooms` : null,
              property.sqft > 0 ? `${formatNumber(property.sqft)} square feet` : null,
            ].filter(Boolean).join(', ')}
          </span>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-white text-[9px] font-bold uppercase tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Brokerage + MLS — demoted trust/reference line */}
          <p className="text-white/55 text-[10px] leading-tight">
            {[property.brokerageName, property.mlsNumber ? `MLS: ${property.mlsNumber}` : null]
              .filter(Boolean).join(' · ')}
          </p>

          {/* ── Primary CTA + route back to full listing ─────────── */}
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/properties/${property.id}#contact`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1C3829] px-4 py-2.5 text-white text-sm font-semibold shadow-lg transition-all hover:bg-[#24493594] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label={`Inquire about ${streetLine}`}
            >
              <MessageSquare size={16} />
              Inquire
            </Link>
            <Link
              href={`/properties/${property.id}`}
              className="shrink-0 text-white/80 text-xs font-semibold underline underline-offset-2 hover:text-white"
            >
              See full listing
            </Link>
          </div>

          {/* Progress bar — slide position indicator */}
          {totalSlides > 1 && (
            <div className="mt-3 h-0.5 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#1C3829] transition-all duration-700"
                style={{ width: `${((imgIndex + 1) / totalSlides) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
