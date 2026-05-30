import { Mail } from 'lucide-react'
import type { NeighbourhoodAgent } from '@/types/neighbourhood'

interface Props {
  agents: NeighbourhoodAgent[]
  neighbourhoodName: string
}

function AgentInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="w-12 h-12 rounded-full bg-[#1C3829] flex items-center justify-center text-white font-semibold text-sm shrink-0">
      {initials}
    </div>
  )
}

function AgentCard({ agent }: { agent: NeighbourhoodAgent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AgentInitials name={agent.name} />
        <div className="min-w-0">
          <p className="font-semibold text-[#111111] text-sm truncate">{agent.name}</p>
          <p className="text-xs text-[#6B6B6B] truncate">{agent.title}</p>
          {agent.listingsCount != null && (
            <p className="text-[10px] text-[#1C3829] font-semibold mt-0.5">
              {agent.listingsCount} active listings
            </p>
          )}
        </div>
      </div>

      <a
        href={agent.email ? `mailto:${agent.email}` : '#'}
        className="flex items-center justify-center gap-2 w-full bg-[#1C3829] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2D5A3D] transition-colors"
      >
        <Mail size={14} />
        Contact
      </a>
    </div>
  )
}

export default function AreaSpecialists({ agents, neighbourhoodName }: Props) {
  if (agents.length === 0) {
    return null
  }

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
            In-Neighbourhood Experts
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#111111]">
            Area Specialists.
          </h2>
        </div>
        <p className="text-xs text-[#6B6B6B] max-w-xs text-right hidden sm:block">
          Top local specialists with an average of 11 active listings in{' '}
          <span className="font-semibold text-[#111111]">{neighbourhoodName}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.slice(0, 3).map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  )
}
