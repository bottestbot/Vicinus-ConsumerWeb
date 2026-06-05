import { Mail } from 'lucide-react'

interface Agent {
  id: string
  name: string
  title?: string
  photoUrl?: string
  brokerageName?: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1C3829] flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initials(agent.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#111111] text-sm truncate">{agent.name}</p>
          {agent.title && <p className="text-xs text-[#6B6B6B] truncate">{agent.title}</p>}
          {agent.brokerageName && (
            <p className="text-[10px] text-[#6B6B6B] truncate">{agent.brokerageName}</p>
          )}
        </div>
      </div>
      <button className="flex items-center justify-center gap-2 w-full bg-[#1C3829] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2D5A3D] transition-colors">
        <Mail size={14} />
        Connect
      </button>
    </div>
  )
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'a1',
    name: 'Sophie Tremblay',
    title: 'REALTOR®',
    brokerageName: "Sotheby's International Realty",
  },
  {
    id: 'a2',
    name: 'James Kwon',
    title: 'Senior Sales Representative',
    brokerageName: 'Royal LePage Signature',
  },
]

export default function VecinusPanel() {
  return (
    <section>
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
          Your Vicinus Team
        </p>
        <h2 className="font-heading text-2xl font-semibold text-[#111111]">
          Your dedicated agents.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  )
}
