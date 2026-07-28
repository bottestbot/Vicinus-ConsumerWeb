'use client'

// FE-411: ActionBar — Save / Share / Contact Agent (forest green background, fixed bottom)
import { useState } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { useSaveListing } from '@/lib/hooks/useSaveListing'
import { useLightboxStore } from '@/store/lightboxStore'
import ShareModal from './ShareModal'

interface ActionBarProps {
  propertyId: string
  agentName: string
  agentPhone?: string
  brokerageName: string
  mlsNumber: string
}

export default function ActionBar({
  propertyId,
  agentName,
  // agentPhone is threaded through for the commented-out Contact Agent CTA below.
  agentPhone: _agentPhone,
  brokerageName,
  mlsNumber,
}: ActionBarProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const { isSaved, saving, saveError, handleSave } = useSaveListing(propertyId)
  const lightboxOpen = useLightboxStore((s) => s.isOpen)

  const url = typeof window !== 'undefined' ? window.location.href : ''

  // The fullscreen photo lightbox has its own Save/Share in its top bar —
  // unmounting this one outright (not just hiding it) is what actually
  // guarantees it can never show through the lightbox's fixed overlay.
  if (lightboxOpen) return null

  return (
    <>
      {shareOpen && <ShareModal url={url} onClose={() => setShareOpen(false)} />}

      <div
        className="fixed bottom-0 left-0 right-0 z-[100] py-4 px-5 sm:px-8"
        style={{ background: '#1C3829' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {/* CREA compliance */}
          <div className="hidden sm:block mr-auto">
            <p className="text-white/50 text-[10px] leading-snug">
              {agentName} · {brokerageName}
            </p>
            <p className="text-white/30 text-[9px]">MLS® {mlsNumber}</p>
          </div>

          {/* Save button */}
          <div className="relative">
            {saveError && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
                Couldn&apos;t save — try again
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition-all',
                isSaved
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:text-white',
                saving ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <Heart
                size={15}
                className={isSaved ? 'fill-white text-white' : ''}
              />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>

          {/* Contact Agent — hidden for now (per request). Fires the CREA
              `email_realtor` lead event; restore when the CTA is re-enabled.
          <a
            href={agentPhone ? `tel:${agentPhone}` : '#'}
            onClick={() => logEmailRealtor(propertyId)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-white text-[#1C3829] hover:bg-white/95 transition-all"
          >
            <Phone size={15} />
            <span>Contact Agent</span>
          </a>
          */}
        </div>
      </div>
    </>
  )
}
