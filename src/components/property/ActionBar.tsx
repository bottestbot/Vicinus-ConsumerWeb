'use client'

// FE-411: ActionBar — Save / Share / Contact Agent (forest green background, fixed bottom)
import { useState } from 'react'
import { Heart, Share2, Phone, Check, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/userStore'
import { saveProperty, unsaveProperty } from '@/lib/api/users'

interface ActionBarProps {
  propertyId: string
  agentName: string
  agentPhone?: string
  brokerageName: string
  mlsNumber: string
}

function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-[#111111]">Share This Listing</h3>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#111111]">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#6B6B6B] bg-[#F7F5F0]"
          />
          <button
            onClick={copy}
            className={[
              'shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1C3829] text-white hover:bg-[#2D5A3D]',
            ].join(' ')}
          >
            {copied ? <Check size={14} /> : 'Copy'}
          </button>
        </div>

        <div className="flex gap-3">
          {[
            {
              label: 'Email',
              href: `mailto:?subject=Property Listing&body=${encodeURIComponent(url)}`,
              emoji: '✉️',
            },
            {
              label: 'WhatsApp',
              href: `https://wa.me/?text=${encodeURIComponent(url)}`,
              emoji: '💬',
            },
            {
              label: 'X',
              href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
              emoji: '🐦',
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-1 py-3 border border-[#E8E6E1] rounded-xl hover:border-[#1C3829] transition-colors text-xs text-[#6B6B6B]"
            >
              <span className="text-lg">{item.emoji}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ActionBar({
  propertyId,
  agentName,
  agentPhone,
  brokerageName,
  mlsNumber,
}: ActionBarProps) {
  const { isSignedIn } = useUser()
  const { savedPropertyIds, toggleSaved } = useUserStore()
  const [shareOpen, setShareOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isSaved = savedPropertyIds.has(propertyId)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  async function handleSave() {
    if (!isSignedIn) {
      // Redirect to sign-in or show nudge
      return
    }
    setSaving(true)
    try {
      if (isSaved) {
        await unsaveProperty(propertyId)
      } else {
        await saveProperty(propertyId)
      }
      toggleSaved(propertyId)
    } catch {
      // Optimistically still toggle for better UX
      toggleSaved(propertyId)
    } finally {
      setSaving(false)
    }
  }

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

          {/* Share button */}
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>

          {/* Contact Agent — primary CTA */}
          <a
            href={agentPhone ? `tel:${agentPhone}` : '#'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-white text-[#1C3829] hover:bg-white/95 transition-all"
          >
            <Phone size={15} />
            <span>Contact Agent</span>
          </a>
        </div>
      </div>
    </>
  )
}
