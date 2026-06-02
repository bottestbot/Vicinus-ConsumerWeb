import { BookOpen, Heart, TreePine, Baby } from 'lucide-react'
import type { Essential, EssentialCategory } from '@/types/neighbourhood'

interface Props {
  essentials: Essential[]
}

const CATEGORY_META: Record<
  EssentialCategory,
  { label: string; icon: React.ReactNode; accent: string }
> = {
  education: {
    label: 'Education',
    icon: <BookOpen size={15} />,
    accent: 'text-[#1C3829] bg-[#EAF0EC]',
  },
  healthcare: {
    label: 'Healthcare',
    icon: <Heart size={15} />,
    accent: 'text-[#1C5460] bg-[#E8F4F7]',
  },
  parks: {
    label: 'Nature & Parks',
    icon: <TreePine size={15} />,
    accent: 'text-white bg-[#1C3829]',
  },
  childcare: {
    label: 'Child Care',
    icon: <Baby size={15} />,
    accent: 'text-[#6B3A1C] bg-[#F7EDE8]',
  },
}

const CATEGORY_ORDER: EssentialCategory[] = ['education', 'healthcare', 'parks', 'childcare']

function EssentialGroup({
  category,
  items,
}: {
  category: EssentialCategory
  items: Essential[]
}) {
  const meta = CATEGORY_META[category]
  const isDark = category === 'parks'

  return (
    <div
      className={[
        'rounded-xl p-4',
        isDark ? 'bg-[#1C3829]' : 'bg-white border border-[#E8E6E1]',
      ].join(' ')}
    >
      <div className={['flex items-center gap-2 mb-3', isDark ? 'text-white' : 'text-[#111111]'].join(' ')}>
        <span className={['p-1.5 rounded-lg', meta.accent].join(' ')}>{meta.icon}</span>
        <p className="text-xs font-semibold uppercase tracking-widest">{meta.label}</p>
      </div>

      {items.length === 0 ? (
        <p className={['text-xs', isDark ? 'text-white/50' : 'text-[#6B6B6B]'].join(' ')}>
          None nearby
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2">
              <span className={['text-xs leading-snug', isDark ? 'text-white/90' : 'text-[#111111]'].join(' ')}>
                {item.name}
              </span>
              <span className={['text-[10px] shrink-0', isDark ? 'text-white/55' : 'text-[#6B6B6B]'].join(' ')}>
                {item.distance}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function LocalEssentials({ essentials }: Props) {
  if (essentials.length === 0) {
    return null
  }

  const grouped = CATEGORY_ORDER.reduce<Record<EssentialCategory, Essential[]>>(
    (acc, cat) => {
      acc[cat] = essentials.filter((e) => e.category === cat)
      return acc
    },
    { education: [], healthcare: [], parks: [], childcare: [] },
  )

  return (
    <section className="py-10 border-b border-[#E8E6E1]">
      <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-1">
        For Your Family
      </p>
      <h2 className="font-heading text-3xl font-semibold text-[#111111] mb-6">
        Local Essentials.
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORY_ORDER.map((cat) => (
          <EssentialGroup key={cat} category={cat} items={grouped[cat]} />
        ))}
      </div>
    </section>
  )
}
