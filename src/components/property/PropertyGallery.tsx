'use client'

// FE-402: PropertyGallery — hero image + thumbnail strip
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid2x2, Heart, Share2 } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { useSaveListing } from '@/lib/hooks/useSaveListing'
import { useLightboxStore } from '@/store/lightboxStore'
import { track } from '@/lib/analytics/capture'
import ShareModal from './ShareModal'

interface PropertyGalleryProps {
  propertyId: string
  images: string[]
  address: string
  price?: number
  listingType?: 'For Sale' | 'For Rent'
  beds?: number
  baths?: number
  sqft?: number
}

export default function PropertyGallery({ propertyId, images, address, price, listingType, beds, baths, sqft }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const { isSaved, saving, handleSave } = useSaveListing(propertyId, 'gallery_lightbox')
  const setLightboxStoreOpen = useLightboxStore((s) => s.setOpen)

  const hero = images[0] ?? ''
  const thumbs = images.slice(1, 5) // Show at most 4 thumbnails, in a 2x2 grid (sm and up)
  const mobileThumbs = images.slice(1) // Mobile gets a scroll strip of every remaining photo

  // The page's own bottom ActionBar is also `position: fixed` — on some
  // browsers a scrollable/backgrounded page behind a fixed overlay lets the
  // page's other fixed elements peek through (the green Save/Share bar
  // bleeding through under the lightbox). Telling ActionBar to unmount itself
  // via a shared store is the only fully reliable fix — CSS layering can't
  // guarantee it across browsers. We also freeze body scroll at its exact
  // position (rather than just `overflow: hidden`) so the page can't shift
  // under the fixed overlay while it's open.
  useEffect(() => {
    setLightboxStoreOpen(lightboxOpen)
    if (!lightboxOpen) return
    const scrollY = window.scrollY
    const body = document.body
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      window.scrollTo(0, scrollY)
    }
  }, [lightboxOpen, setLightboxStoreOpen])

  function openLightbox(idx: number) {
    setLightboxIndex(idx)
    setLightboxOpen(true)
    track('property_media_viewed', { listing_key: propertyId, media_type: 'photo' })
  }

  function closeLightbox() {
    setLightboxOpen(false)
  }

  function prev() {
    setLightboxIndex((i) => (i - 1 + images.length) % images.length)
  }

  function next() {
    setLightboxIndex((i) => (i + 1) % images.length)
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <>
      {/* ── Gallery Grid ────────────────────────────────────────────────── */}
      {/* PDP-02: on mobile the fixed 3-col grid crammed hero + thumbs into tiny
          columns. Stack to a single full-width hero (shorter height) and reveal
          the thumbnail column only from `sm` up. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 h-[300px] sm:h-[440px] rounded-2xl overflow-hidden">
        {/* Hero — full width on mobile, 2/3 from sm up */}
        <div
          className="col-span-1 sm:col-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          {hero && (
            <Image
              src={hero}
              alt={`${address} — hero`}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover object-left-top group-hover:brightness-95 transition-all duration-300"
              priority
            />
          )}
          {/* "All photos" pill */}
          <button
            onClick={(e) => { e.stopPropagation(); openLightbox(0) }}
            className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#111111] text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-white transition-colors"
          >
            <Grid2x2 size={12} />
            {images.length} photos
          </button>
        </div>

        {/* Thumbnails — 1/3 width, 2x2 grid (hidden on mobile) */}
        <div className="hidden sm:grid grid-cols-2 grid-rows-2 gap-1.5">
          {thumbs.map((src, i) => (
            <div
              key={src}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => openLightbox(i + 1)}
            >
              <Image
                src={src}
                alt={`${address} — photo ${i + 2}`}
                fill
                sizes="16vw"
                className="object-cover object-left-top group-hover:brightness-95 transition-all duration-300"
              />
              {/* "More" overlay on last visible thumb */}
              {i === thumbs.length - 1 && images.length > thumbs.length + 1 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    +{images.length - thumbs.length - 1} more
                  </span>
                </div>
              )}
            </div>
          ))}
          {/* Placeholder cells if fewer than 4 thumbs */}
          {thumbs.length < 4 &&
            Array.from({ length: 4 - thumbs.length }).map((_, i) => (
              <div key={`ph-${i}`} className="bg-[#E8E6E1] rounded-sm" />
            ))}
        </div>
      </div>

      {/* Mobile thumbnail strip — the 2x2 grid above is sm+ only, so mobile
          otherwise has no way to browse photos without opening the lightbox. */}
      {mobileThumbs.length > 0 && (
        <div className="sm:hidden flex gap-1.5 overflow-x-auto mt-1.5 -mx-4 px-4">
          {mobileThumbs.map((src, i) => (
            <button
              key={src}
              onClick={() => openLightbox(i + 1)}
              className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden"
            >
              <Image src={src} alt={`${address} — photo ${i + 2}`} fill sizes="64px" className="object-cover object-left-top" />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {/* Portaled to document.body — a plain `fixed inset-0` can still end up
          behind other fixed page chrome depending on DOM position/stacking
          context, so this renders as the very last node in <body> and uses
          the highest z-index in the app to guarantee it sits above everything. */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 h-dvh z-[9999] bg-black flex flex-col overscroll-none">
          {shareOpen && <ShareModal url={shareUrl} onClose={() => setShareOpen(false)} />}

          {/* Top bar — back / counter / save / share / close, Zillow-style */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <button
              onClick={closeLightbox}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Back to listing</span>
            </button>
            <div className="text-white/60 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
                className={[
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isSaved ? 'text-white' : 'text-white/80 hover:text-white',
                  saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10',
                ].join(' ')}
              >
                <Heart size={18} className={isSaved ? 'fill-white text-white' : ''} />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={closeLightbox}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16">
            <button
              onClick={prev}
              className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/10 transition-colors z-10"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="relative w-full h-full">
              <Image
                src={images[lightboxIndex] ?? ''}
                alt={`${address} — photo ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            <button
              onClick={next}
              className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/10 transition-colors z-10"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Thumbnails strip */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto px-4 py-2.5 sm:py-3 shrink-0">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={[
                  'relative shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded overflow-hidden border-2 transition-all',
                  i === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100',
                ].join(' ')}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover object-left-top" />
              </button>
            ))}
          </div>

          {/* Bottom description bar — address / price / beds & baths, Zillow-style */}
          <div className="border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <p className="text-white text-sm sm:text-base font-medium truncate">{address}</p>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              {price != null && (
                <>
                  {listingType === 'For Sale' ? 'For sale: ' : listingType === 'For Rent' ? 'For rent: ' : ''}
                  {formatPrice(price)}
                  {listingType === 'For Rent' ? '/mo' : ''}
                  {(beds != null || baths != null || sqft != null) && '  ·  '}
                </>
              )}
              {beds != null && `${beds} bd`}
              {beds != null && baths != null && ', '}
              {baths != null && `${baths} ba`}
              {sqft != null && `, ${sqft.toLocaleString()} sqft`}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
