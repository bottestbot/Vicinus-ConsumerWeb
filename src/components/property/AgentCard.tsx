'use client'

// Agent contact card — appears in the right sidebar of the detail page
import { Phone, Mail, ExternalLink } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'
import { realtorHref } from '@/lib/format'
import { logEmailRealtor, logListingClick } from '@/lib/api/analytics'

interface AgentCardProps {
  property: PropertyDetail
}

export default function AgentCard({ property }: AgentCardProps) {
  // DDF sometimes omits the agent name but supplies the brokerage. Fall back to
  // the brokerage for the primary line + avatar so the card is never blank.
  const primaryName = property.agentName || property.brokerageName || 'Listing Brokerage'
  const initials =
    primaryName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'RE'

  // CREA-05: contacting the listing REALTOR(R) is the `email_realtor` event the
  // REAW tier requires us to report. Both CTAs below are leads, so both fire it.
  const reportLead = () => logEmailRealtor(property.id)

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-6 sticky top-20">
      {/* Agent info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#1C3829] flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#111111] text-sm truncate">{primaryName}</p>
          <p className="text-xs text-[#6B6B6B] truncate">{property.agentTitle}</p>
          {/* Only repeat the brokerage line when it differs from the primary name */}
          {property.brokerageName && property.brokerageName !== primaryName && (
            <p className="text-[10px] text-[#6B6B6B] truncate">{property.brokerageName}</p>
          )}
        </div>
      </div>

      {/* MLS® number already shown right next to this card in PropertyStats — a
          second boxed callout here just duplicated it in the most visually
          prominent of the four places it appears on this page. Dropped. */}

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5">
        {property.agentPhone && (
          <a
            href={`tel:${property.agentPhone}`}
            onClick={reportLead}
            className="flex items-center justify-center gap-2 w-full bg-[#1C3829] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2D5A3D] transition-colors"
          >
            <Phone size={14} />
            Contact Agent
          </a>
        )}
        <button
          onClick={reportLead}
          className="flex items-center justify-center gap-2 w-full border border-[#E8E6E1] text-[#111111] text-sm font-medium py-2.5 rounded-xl hover:border-[#1C3829] transition-colors">
          <Mail size={14} />
          Send Message
        </button>
        <a
          href={realtorHref(property.realtorUrl)}
          onClick={() => logListingClick(property.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[10px] text-[#6B6B6B] hover:text-[#1C3829] transition-colors mt-1"
        >
          <ExternalLink size={10} />
          View on REALTOR.ca
        </a>
      </div>
    </div>
  )
}
