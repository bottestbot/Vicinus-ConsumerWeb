'use client'

// PDP-01: VirtualTour — renders the listing's video tour (YouTube embed) and/or
// a branded/unbranded virtual-tour link. The DDF feed exposes these via
// `youtubeUrl` (Media "Video Tour Website") and `virtualTourUrl`
// (VirtualTourURLBranded/Unbranded); both were previously dropped by the FE.
import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'

interface VirtualTourProps {
  youtubeUrl?: string
  virtualTourUrl?: string
}

/** Pull the 11-char video id out of any common YouTube URL shape. */
function youtubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // /embed/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // /shorts/ID
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export default function VirtualTour({ youtubeUrl, virtualTourUrl }: VirtualTourProps) {
  const [playing, setPlaying] = useState(false)

  const videoId = youtubeUrl ? youtubeId(youtubeUrl) : null
  // A virtual-tour URL that is itself a YouTube link would be redundant with the
  // embed — only surface the standalone tour link when it isn't the same video.
  const tourIsYoutube = virtualTourUrl ? youtubeId(virtualTourUrl) != null : false
  const showTourLink = !!virtualTourUrl && !tourIsYoutube

  // Nothing to show → hide the section entirely (HIDE-EMPTY convention).
  if (!videoId && !showTourLink) return null

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-[#111111] mb-4">
        Video &amp; virtual tour
      </h2>

      {videoId && (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="Property video tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 w-full h-full"
              aria-label="Play property video tour"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Property video tour thumbnail"
                className="absolute inset-0 w-full h-full object-cover group-hover:brightness-90 transition-all"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 group-hover:bg-white shadow-lg transition-colors">
                  <Play size={26} className="text-[#1C3829] translate-x-0.5" fill="currentColor" />
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {showTourLink && (
        <a
          href={virtualTourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 text-sm font-medium text-[#1C3829] hover:underline ${
            videoId ? 'mt-4' : ''
          }`}
        >
          <ExternalLink size={15} />
          Open interactive virtual tour
        </a>
      )}
    </section>
  )
}
