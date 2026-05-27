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
  const thumbs = images.slice(1, 3) // Show at most 2 stacked thumbnails

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
      <div className="grid grid-cols-3 gap-1.5 h-[440px] rounded-2xl overflow-hidden">
        {/* Hero — 2/3 width */}
        <div
          className="col-span-2 relative cursor-pointer group"
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

        {/* Thumbnails — 1/3 width, stacked */}
        <div className="flex flex-col gap-1.5">
          {thumbs.map((src, i) => (
            <div
              key={i}
              className="relative flex-1 cursor-pointer group overflow-hidden"
              onClick={() => openLightbox(i + 1)}
            >
              <Image
                src={src}
                alt={`${address} — photo ${i + 2}`}
                fill
                sizes="33vw"
                className="object-cover group-hover:brightness-95 transition-all duration-300"
              />
              {/* "More" overlay on last visible thumb */}
              {i === thumbs.length - 1 && images.length > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">+{images.length - 3} more</span>
                </div>
              )}
            </div>
          ))}
          {/* Placeholder rows if fewer than 2 thumbs */}
          {thumbs.length < 2 &&
            Array.from({ length: 2 - thumbs.length }).map((_, i) => (
              <div key={`ph-${i}`} className="flex-1 bg-[#E8E6E1] rounded-sm" />
            ))}
        </div>
      </div>

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
