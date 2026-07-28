'use client'

// Homepage "Get in Touch" form. Unlike ContactAgentModal, this message goes to
// the Vicinus team, not a listing REALTOR® — there is no listingKey or
// propertyAddress, and nothing here is forwarded to CREA's DDF Lead API.
import { useState } from 'react'
import { X, Check, Mail } from 'lucide-react'
import { submitContact, type ContactInterest } from '@/lib/api/contact'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MESSAGE_MAX = 500

const INTEREST_OPTIONS: { value: ContactInterest; label: string }[] = [
  { value: 'buy', label: 'Buying' },
  { value: 'sell', label: 'Selling' },
]

type Status = 'idle' | 'submitting' | 'success' | 'error'

interface ContactVicinusModalProps {
  onClose: () => void
}

export default function ContactVicinusModal({ onClose }: ContactVicinusModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState<ContactInterest | null>(null)
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot — must stay empty
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Please enter your name.')
    if (!EMAIL_RE.test(email)) return setError('Please enter a valid email address.')

    setStatus('submitting')
    try {
      const { ok } = await submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        interest: interest ?? undefined,
        company: company || undefined,
      })
      if (!ok) {
        setStatus('error')
        setError("We couldn't send your message right now. Please try again.")
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  const inputCls =
    'w-full rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#9A9A9A] outline-none transition-colors focus:border-[#1C3829] focus:bg-white'
  const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]'

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-[#111111]">Get in Touch</h3>
            <p className="mt-0.5 text-xs text-[#6B6B6B]">
              Tell us a bit about what you&apos;re looking for.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-[#6B6B6B] hover:text-[#111111]"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1C3829]">
              <Check size={22} className="text-[#A3E635]" />
            </div>
            <h4 className="mt-4 font-heading text-xl font-bold text-[#111111]">Message sent</h4>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              Thanks for reaching out. A member of the Vicinus team will get back to you shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[#1C3829] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2D5A3D]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3.5">
              <div>
                <label htmlFor="cv-name" className={labelCls}>
                  Name
                </label>
                <input
                  id="cv-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="cv-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="cv-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="cv-phone" className={labelCls}>
                  Phone <span className="text-[#9A9A9A] normal-case">(optional)</span>
                </label>
                <input
                  id="cv-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(604) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <span className={labelCls}>
                  Looking to <span className="text-[#9A9A9A] normal-case">(optional)</span>
                </span>
                <div className="flex gap-2" role="group" aria-label="Looking to buy or sell">
                  {INTEREST_OPTIONS.map((o) => {
                    const active = interest === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setInterest(active ? null : o.value)}
                        aria-pressed={active}
                        className={[
                          'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'border-[#1C3829] bg-[#1C3829] text-white'
                            : 'border-[#E8E6E1] bg-[#FAF9F6] text-[#6B6B6B] hover:border-[#1C3829]',
                        ].join(' ')}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="cv-message" className={labelCls}>
                  Message <span className="text-[#9A9A9A] normal-case">(optional)</span>
                </label>
                <textarea
                  id="cv-message"
                  rows={4}
                  maxLength={MESSAGE_MAX}
                  placeholder="What can we help you with?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
                <p className="mt-1 text-right text-[10px] text-[#9A9A9A]">
                  {message.length}/{MESSAGE_MAX}
                </p>
              </div>
            </div>

            {/* Honeypot — hidden from humans, tempting to bots. Never render visibly. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="cv-company">Company</label>
              <input
                id="cv-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {error && <p className="mt-3 text-sm text-[#C0392B]">{error}</p>}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C3829] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2D5A3D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail size={15} />
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>

            <p className="mt-3 text-[10px] leading-snug text-[#9A9A9A]">
              Your message is sent to the Vicinus team. By submitting, you agree to be contacted.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
