import { Heart, Share2 } from 'lucide-react'

function PhonePreview() {
  return (
    <div className="mx-auto w-56 rounded-[2.25rem] border-[8px] border-[#111111] bg-[#111111] shadow-2xl sm:w-64">
      <div className="overflow-hidden rounded-[1.75rem] bg-white">
        <div className="relative h-44 bg-[#1C2C1A] sm:h-52">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
            <Heart size={14} className="text-[#1C3829]" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 px-3 py-2">
            <p className="text-sm font-bold text-[#111111]">$1,650,000</p>
            <p className="text-[10px] text-[#6B6B6B]">1420 Cypress St, Kitsilano</p>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <div className="h-2 w-3/4 rounded-full bg-[#E8E6E1]" />
          <div className="h-2 w-1/2 rounded-full bg-[#E8E6E1]" />
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-[#1C3829] px-3 py-1 text-[9px] font-semibold text-white">
              View Details
            </span>
            <Share2 size={13} className="text-[#6B6B6B]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-[#E8E6E1] bg-[#F2F0EB] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E36A5B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E8B84B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7FBF7F]" />
        <span className="ml-3 h-4 flex-1 rounded bg-white/70" />
      </div>
      <div className="p-4">
        <p className="text-[11px] text-[#6B6B6B]">Welcome back, Tom</p>
        <p className="mb-3 text-[13px] font-semibold text-[#111111]">Your saved search</p>
        <div className="space-y-2">
          {[
            { addr: '2210 Trafalgar St', price: '$2,150,000', tag: 'New' },
            { addr: '885 W 23rd Ave', price: '$1,899,000', tag: 'Price drop' },
            { addr: '4310 Point Grey Rd', price: '$3,450,000', tag: 'Open house' },
          ].map((row) => (
            <div
              key={row.addr}
              className="flex items-center justify-between rounded-lg border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-9 rounded-md bg-[#1C2C1A]" />
                <div>
                  <p className="text-[11px] font-semibold text-[#111111]">{row.addr}</p>
                  <p className="text-[10px] text-[#6B6B6B]">{row.price}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#A3E635]/20 px-2 py-0.5 text-[9px] font-semibold text-[#1C3829]">
                {row.tag}
              </span>
            </div>
          ))}
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
