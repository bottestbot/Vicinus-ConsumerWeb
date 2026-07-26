'use client'

// Global lead reach-out flow (CREA-05). Any surface can open the "Email
// REALTOR®" inquiry modal via useLeadInquiry().openInquiry(...) — the provider
// hosts a single ContactAgentModal so the submit path and the DDF compliance
// side effects (POST /lead/inquiry + the `email_realtor` event on success)
// stay identical everywhere a lead can originate: detail page, feed, cards.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ContactAgentModal from '@/components/property/ContactAgentModal'

export interface LeadInquiryTarget {
  /** DDF ListingKey. */
  listingKey: string
  /** Full listing address — modal header + notification subject line. */
  propertyAddress: string
  /** Listing agent; the modal falls back to "the listing agent" when empty. */
  agentName?: string
}

interface LeadInquiryContextValue {
  openInquiry: (target: LeadInquiryTarget) => void
}

const LeadInquiryContext = createContext<LeadInquiryContextValue | null>(null)

export function useLeadInquiry(): LeadInquiryContextValue {
  const ctx = useContext(LeadInquiryContext)
  if (!ctx) throw new Error('useLeadInquiry must be used within LeadInquiryProvider')
  return ctx
}

export default function LeadInquiryProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<LeadInquiryTarget | null>(null)
  const openInquiry = useCallback((t: LeadInquiryTarget) => setTarget(t), [])
  const value = useMemo(() => ({ openInquiry }), [openInquiry])

  return (
    <LeadInquiryContext.Provider value={value}>
      {children}
      {target && (
        <ContactAgentModal
          listingKey={target.listingKey}
          propertyAddress={target.propertyAddress}
          agentName={target.agentName ?? ''}
          onClose={() => setTarget(null)}
        />
      )}
    </LeadInquiryContext.Provider>
  )
}
