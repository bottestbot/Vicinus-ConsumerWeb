// Self-contained "map" mock — no Mapbox/external asset dependency, matches
// the lightweight preview pattern used throughout this page.
function MapPreview() {
  const pins = [
    { top: '22%', left: '30%' },
    { top: '38%', left: '58%' },
    { top: '55%', left: '22%' },
    { top: '62%', left: '68%' },
    { top: '75%', left: '42%' },
    { top: '30%', left: '78%' },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#EDEAE2] shadow-xl ring-1 ring-black/5">
      <div className="relative h-72 sm:h-80">
        {/* Faux road grid */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(6)].map((_, i) => (
            <span
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-[#C9C4B6]"
              style={{ top: `${(i + 1) * 14}%` }}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <span
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-[#C9C4B6]"
              style={{ left: `${(i + 1) * 16}%` }}
            />
          ))}
        </div>

        {pins.map((p, i) => (
          <span
            key={i}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1C3829] shadow-md"
            style={{ top: p.top, left: p.left }}
          />
        ))}

        {/* Listing card overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white p-3 shadow-lg sm:right-auto sm:w-64">
          <div className="h-12 w-14 shrink-0 rounded-lg bg-[#1C2C1A]" />
          <div>
            <p className="text-sm font-bold text-[#111111]">$1,650,000</p>
            <p className="text-[11px] text-[#6B6B6B]">3 bed &middot; 2 bath &middot; Kitsilano</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RealtorHubListings() {
  return (
    <section className="bg-[#FAF9F6] px-6 py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-heading text-3xl font-bold leading-tight text-[#111111] sm:text-4xl">
            Your listings are already here.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#6B6B6B]">
            Most of the market will live on Vicinus on day one. Just claim yours, lock any
            remaining properties in your area, turn on notifications, and get alerted the moment a
            lead comes in.
          </p>
        </div>
        <MapPreview />
      </div>
    </section>
  )
}
