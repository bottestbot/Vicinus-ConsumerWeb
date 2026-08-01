const ITEMS = [
  'Built right here in Vancouver by an active local Realtor.',
  'Combining what the market needs with what agents want.',
  'Free to get started.',
]

export default function RealtorHubBanner() {
  return (
    <section className="border-y border-white/10 bg-[#1C3829] px-6 py-5">
      <div className="mx-auto flex max-w-6xl flex-col flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center sm:flex-row">
        {ITEMS.map((item, i) => (
          <span key={item} className="flex items-center gap-x-10">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">
              {item}
            </span>
            {i < ITEMS.length - 1 && (
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[#A3E635] sm:inline-block" />
            )}
          </span>
        ))}
      </div>
    </section>
  )
}
