import { Bookmark, Share2, MessageSquare, VolumeX, Search, Sparkles, Home, TrendingDown } from 'lucide-react'

// Self-contained mocks of the live product screens — no external asset
// dependency, matching the lightweight preview pattern used across this page.

// The consumer-facing listing reel: full-bleed media, rail of actions on the
// right, price/address overlay along the bottom.
function PhonePreview() {
  return (
    <div className="mx-auto w-56 rounded-[2.25rem] border-[8px] border-[#111111] bg-[#111111] shadow-2xl sm:w-64">
      <div className="relative aspect-[9/17] overflow-hidden rounded-[1.75rem] bg-[#0B0B0B]">
        {/* Dusk sky → treeline → dark foreground, standing in for listing media. */}
        <div className="absolute inset-0">
          <div className="h-1/2 bg-gradient-to-b from-[#54607A] via-[#C69A87] to-[#E8B48C]" />
          <div className="h-1/2 bg-gradient-to-b from-[#6E7A5E] via-[#3D4436] to-[#141414]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />

        {/* Story progress segments */}
        <div className="absolute inset-x-3 top-2.5 flex gap-1">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/35'}`}
            />
          ))}
        </div>

        <span className="absolute left-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-black/45">
          <VolumeX size={11} className="text-white" />
        </span>

        {/* Action rail */}
        <div className="absolute bottom-24 right-2.5 flex flex-col items-center gap-3">
          {[
            { Icon: Bookmark, label: 'Save' },
            { Icon: Share2, label: 'Share' },
            { Icon: MessageSquare, label: 'Inquire' },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
                <Icon size={14} className="text-white" />
              </span>
              <span className="text-[7px] font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>

        {/* Listing overlay */}
        <div className="absolute inset-x-3 bottom-3 space-y-0.5">
          <p className="text-lg font-bold leading-none text-white">$2,650,000</p>
          <p className="truncate text-[9px] font-semibold text-white">
            351 W 28TH STREET, North Vancouver
          </p>
          <p className="text-[8px] text-white/85">4 bd · 5 ba · 3,080 sqft</p>
          <p className="truncate text-[7px] text-white/60">
            Stilhavn Real Estate Services · MLS® R3143015
          </p>
          <p className="pt-0.5 text-[8px] font-semibold text-white underline">See full listing</p>
          <span className="mt-1 block h-0.5 w-full rounded-full bg-white/25">
            <span className="block h-full w-2/5 rounded-full bg-[#A3E635]" />
          </span>
        </div>
      </div>
    </div>
  )
}

// The signed-in buyer dashboard: IQ brief, search, and the notifications rail.
function WorkspacePreview() {
  const alerts = [
    { title: '2 2438 E 20th Avenue', when: '4h', drop: false },
    { title: '1 2438 E 20th Avenue', when: '4h', drop: false },
    { title: '235 602 E 2nd Street', when: '23h', drop: false },
    { title: '185 815 W 49th Avenue', when: 'Jul 31', drop: true },
  ]

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-[#E8E6E1] bg-[#F2F0EB] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E36A5B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E8B84B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7FBF7F]" />
        <span className="ml-3 h-4 flex-1 rounded bg-white/70" />
      </div>

      <div className="flex gap-2.5 bg-[#FAF9F6] p-3">
        {/* Main column */}
        <div className="flex-1 space-y-2.5">
          <p className="text-[7px] text-[#6B6B6B]">6 saved properties · 6 recently viewed</p>

          <div className="rounded-xl bg-[#1C3829] p-3">
            <p className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-wider text-[#A3E635]">
              <Sparkles size={8} />
              Vicinus IQ Brief
            </p>
            <p className="mt-1.5 text-[13px] font-bold leading-none text-white">
              236 updates this week
            </p>
            <p className="mt-1.5 text-[7px] leading-relaxed text-white/75">
              In the last 7 days, your saved searches and properties saw 236 updates — 96 new
              listings, 105 open houses, and 35 price drops.
            </p>
            <div className="mt-2 flex gap-1.5">
              {['$1,449,900', '$1,529,900'].map((p) => (
                <span
                  key={p}
                  className="flex items-center gap-1 rounded-full border border-[#A3E635]/40 px-1.5 py-1"
                >
                  <Home size={8} className="shrink-0 text-[#A3E635]" />
                  <span className="text-[7px] font-semibold text-white">{p}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E6E1] bg-white p-2.5">
            <p className="text-[7px] font-semibold uppercase tracking-wider text-[#111111]">
              Find your home
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="flex flex-1 items-center gap-1 rounded-lg border border-[#E8E6E1] px-1.5 py-1.5">
                <Search size={8} className="shrink-0 text-[#9B9B9B]" />
                <span className="truncate text-[7px] text-[#9B9B9B]">Neighbourhood, City…</span>
              </span>
              <span className="rounded-lg bg-[#1C3829] px-2 py-1.5 text-[7px] font-semibold text-white">
                Search
              </span>
            </div>
          </div>
        </div>

        {/* Notifications rail */}
        <div className="hidden w-[38%] shrink-0 rounded-xl border border-[#E8E6E1] bg-white p-2 sm:block">
          <p className="text-[9px] font-bold text-[#111111]">Notifications</p>
          <div className="mt-1.5 flex gap-1">
            <span className="rounded-full bg-[#111111] px-1.5 py-0.5 text-[6px] font-semibold text-white">
              Alerts
            </span>
            <span className="px-1 py-0.5 text-[6px] text-[#6B6B6B]">All</span>
            <span className="px-1 py-0.5 text-[6px] text-[#6B6B6B]">Schedule</span>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {alerts.map((a) => (
              <div key={a.title} className="flex items-start gap-1.5 border-t border-[#F0EEE9] pt-1.5">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md ${
                    a.drop ? 'bg-[#FBE9E7]' : 'bg-[#EDF3EA]'
                  }`}
                >
                  {a.drop ? (
                    <TrendingDown size={7} className="text-[#C0553F]" />
                  ) : (
                    <Home size={7} className="text-[#1C3829]" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[7px] font-semibold text-[#111111]">
                    {a.drop ? 'Price drop' : 'New listing'}: {a.title}
                  </span>
                  <span className="block text-[6px] text-[#6B6B6B]">Matches your saved search</span>
                </span>
                <span className="shrink-0 text-[6px] text-[#9B9B9B]">{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RealtorHubShowcase() {
  return (
    <section className="bg-[#FAF9F6] px-6 py-4 lg:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 lg:gap-28">
        {/* Row A: phone left, copy right */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <PhonePreview />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="font-heading text-3xl font-bold leading-tight text-[#111111] sm:text-4xl">
              Show homes the way people actually browse.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#6B6B6B]">
              Built-in listing tools make your properties look modern and shareable everywhere —
              no more clunky sliders or distorted photos.
            </p>
          </div>
        </div>

        {/* Row B: copy left, workspace right */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[#111111] sm:text-4xl">
              Give your clients a better experience.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#6B6B6B]">
              Give active buyers their own Vicinus workspace to keep their entire search organized
              in one place — collaboration that feels like a service, not a transaction.
            </p>
          </div>
          <div>
            <WorkspacePreview />
          </div>
        </div>
      </div>
    </section>
  )
}
