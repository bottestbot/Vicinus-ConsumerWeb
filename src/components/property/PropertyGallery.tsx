'use client'

// FE-402: PropertyGallery — hero image + thumbnail strip
import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid2x2 } from 'lucide-react'

interface PropertyGalleryProps {
  images: string[]
  address: string
}

export default function PropertyGallery({ images, address }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const hero = images[0] ?? ''
  const thumbs = images.slice(1, 5) // Show at most 4 thumbnails, in a 2x2 grid (sm and up)
  const mobileThumbs = images.slice(1) // Mobile gets a scroll strip of every remaining photo

  function openLightbox(idx: number) {
    setLightboxIndex(idx)
    setLightboxOpen(true)
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
              className="object-cover group-hover:brightness-95 transition-all duration-300"
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
                className="object-cover group-hover:brightness-95 transition-all duration-300"
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
              <Image src={src} alt={`${address} — photo ${i + 2}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>

          <div
            className="relative w-full max-w-4xl aspect-video mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex] ?? ''}
              alt={`${address} — photo ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={28} />
          </button>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Thumbnails strip */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                className={[
                  'relative w-12 h-9 rounded overflow-hidden border-2 transition-all',
                  i === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100',
                ].join(' ')}
              >
                <Image src={src} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
