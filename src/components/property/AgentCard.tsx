// Agent contact card — appears in the right sidebar of the detail page
import { Phone, Mail, ExternalLink } from 'lucide-react'
import type { PropertyDetail } from '@/types/property'

interface AgentCardProps {
  property: PropertyDetail
}

export default function AgentCard({ property }: AgentCardProps) {
  const initials = property.agentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5 sticky top-20">
      {/* Agent info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#1C3829] flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#111111] text-sm truncate">{property.agentName}</p>
          <p className="text-xs text-[#6B6B6B] truncate">{property.agentTitle}</p>
          <p className="text-[10px] text-[#6B6B6B] truncate">{property.brokerageName}</p>
        </div>
      </div>

      {/* MLS */}
      <div className="bg-[#F7F5F0] rounded-lg px-3 py-2 mb-4">
        <p className="text-[10px] text-[#6B6B6B]">MLS® Number</p>
        <p className="text-xs font-semibold text-[#111111]">{property.mlsNumber}</p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5">
        {property.agentPhone && (
          <a
            href={`tel:${property.agentPhone}`}
            className="flex items-center justify-center gap-2 w-full bg-[#1C3829] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2D5A3D] transition-colors"
          >
            <Phone size={14} />
            {property.agentPhone}
          </a>
        )}
        <button className="flex items-center justify-center gap-2 w-full border border-[#E8E6E1] text-[#111111] text-sm font-medium py-2.5 rounded-xl hover:border-[#1C3829] transition-colors">
          <Mail size={14} />
          Send Message
        </button>
        <a
          href="https://www.realtor.ca"
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
