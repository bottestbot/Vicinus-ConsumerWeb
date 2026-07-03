export default function FoundingMemberBand() {
  return (
    <section className="bg-[#FAF9F6] px-6 pb-20 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#1C2C1A] px-8 py-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold text-white">
              Join as a Founding Member.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              We&apos;re opening early access to a limited group of Realtors before public launch.
              Founding members get priority onboarding and exclusive pricing when Vicinus goes
              live.
            </p>
          </div>
          <a
            href="#waitlist"
            className="shrink-0 rounded-lg border border-[#A3E635]/50 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#A3E635] transition-colors hover:bg-[#A3E635] hover:text-[#111111]"
          >
            Limited Access
          </a>
        </div>
      </div>
    </section>
  )
}
