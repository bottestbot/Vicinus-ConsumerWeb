import type { PropertySummaryData } from '@/lib/api/properties'

interface Props {
  summary: PropertySummaryData
}

function SummaryCard({
  title,
  summary,
  bullets,
  chips,
}: {
  title: string
  summary: string
  bullets?: string[]
  chips: string[]
}) {
  return (
    <div className="bg-white rounded-2xl p-8 flex flex-col gap-5">
      <p className="text-[11px] font-semibold tracking-widest text-[#4A7C59] uppercase">{title}</p>
      <p className="text-[15px] text-[#111111] leading-relaxed">{summary}</p>
      {bullets && bullets.length > 0 && (
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-[#3A3A3A]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4A7C59] shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 mt-1">
        {chips.map((chip) => (
          <span
            key={chip}
            className="px-3 py-1 rounded-full border border-[#D1CEC9] text-[12px] text-[#3A3A3A] font-medium"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PropertySummary({ summary }: Props) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#111111]">Property Summary</h2>
        <span className="px-3 py-1 rounded-full bg-[#1C3829] text-white text-[11px] font-semibold tracking-wide uppercase">
          Powered by Vicinus
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryCard
          title="About the Property"
          summary={summary.propertyOverview.summary}
          bullets={summary.propertyOverview.bullets}
          chips={summary.propertyOverview.chips}
        />
        <SummaryCard
          title="Lifestyle Fit"
          summary={summary.lifestyleFit.summary}
          chips={summary.lifestyleFit.chips}
        />
      </div>

      <p className="mt-4 text-[12px] text-[#9B9B9B] italic">
        This AI-generated summary is for informational context only.
      </p>
    </section>
  )
}
