'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  altPrefix: string
  subtitle?: string
}

export default function NeighbourhoodHeroCarousel({ images, altPrefix, subtitle }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ left: index * container.clientWidth, behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    setCurrentIndex(Math.round(container.scrollLeft / container.clientWidth))
  }, [])

  const total = images.length

  return (
    <div className="relative h-full min-h-[480px] md:min-h-[600px] w-full overflow-hidden rounded-2xl">
      {/* Scroll track */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, i) => (
          <div key={i} className="snap-start flex-shrink-0 w-full h-full relative">
            <Image
              src={src}
              alt={`${altPrefix} photo ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 65vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

      {/* Title overlay */}
      <div className="absolute bottom-8 left-8 pointer-events-none">
        <h1 className="font-heading text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-sm">
          {altPrefix}.
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-white/75 text-base font-ui tracking-wide">{subtitle}</p>
        )}
      </div>

      {/* Prev / Next — desktop only */}
      {total > 1 && (
        <>
          <button
            onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
            aria-label="Previous photo"
            className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-sm bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(total - 1, currentIndex + 1))}
            aria-label="Next photo"
            className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-sm bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? 'w-2.5 h-2.5 bg-[#C9A96E]'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
