'use client'

// Extracted from ActionBar so the property lightbox can reuse the same share UI.
import { useState } from 'react'
import { X, Check } from 'lucide-react'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="#25D366" aria-hidden="true">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.336-.943.164-.464.164-.86.115-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="#E1306C" aria-hidden="true">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    </svg>
  )
}

export default function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [instagramCopied, setInstagramCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Instagram has no web share-intent URL (unlike WhatsApp/X) — the standard
  // workaround is to copy the link so it can be pasted into a bio/DM/story.
  async function copyForInstagram() {
    await navigator.clipboard.writeText(url)
    setInstagramCopied(true)
    setTimeout(() => setInstagramCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
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
              icon: <span className="text-lg">✉️</span>,
            },
            {
              label: 'WhatsApp',
              href: `https://wa.me/?text=${encodeURIComponent(url)}`,
              icon: <WhatsAppIcon />,
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-1 py-3 border border-[#E8E6E1] rounded-xl hover:border-[#1C3829] transition-colors text-xs text-[#6B6B6B]"
            >
              {item.icon}
              {item.label}
            </a>
          ))}

          {/* Instagram: no web share-intent exists, so this copies the link instead. */}
          <button
            onClick={copyForInstagram}
            className="flex-1 flex flex-col items-center gap-1 py-3 border border-[#E8E6E1] rounded-xl hover:border-[#1C3829] transition-colors text-xs text-[#6B6B6B]"
          >
            {instagramCopied ? <Check size={18} className="text-emerald-600" /> : <InstagramIcon />}
            {instagramCopied ? 'Copied!' : 'Instagram'}
          </button>
        </div>
      </div>
    </div>
  )
}
