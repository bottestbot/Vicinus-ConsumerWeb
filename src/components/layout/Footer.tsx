import Link from 'next/link'
import Logo from '@/components/brand/Logo'

// Only real, existing routes are linked here — Terms / About / Contact pages
// don't exist yet, so they're intentionally omitted rather than shipped as 404s
// (DSGN-03). Add them here once those pages are built.
const EXPLORE_LINKS = [
  { label: 'Buy', href: '/search?listingType=For+Sale' },
  { label: 'Sell', href: '/sell' },
  { label: 'Neighbourhoods', href: '/neighbourhoods' },
  { label: 'Realtor Hub', href: '/realtor-hub' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1C3829] text-white/60 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Logo variant="light" className="text-sm" />
            <p className="text-white/50 leading-relaxed max-w-xs">
              Beyond data. The Vicinus standard — intelligent curation of
              Canada&apos;s finest properties.
            </p>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-2.5">
            <p className="text-white/40 uppercase tracking-widest text-[10px] font-semibold mb-1">
              Explore
            </p>
            {EXPLORE_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-white/60 hover:text-white/90 transition-colors w-fit"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2.5">
            <p className="text-white/40 uppercase tracking-widest text-[10px] font-semibold mb-1">
              Legal
            </p>
            <Link
              href="/privacy"
              className="text-white/60 hover:text-white/90 transition-colors w-fit"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* MLS / CREA attribution (compliance + trust) */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col gap-4">
          <p className="text-white/40 leading-relaxed max-w-3xl">
            Listing data is provided by the Canadian Real Estate Association
            (CREA) Data Distribution Facility (DDF®). REALTOR®, MLS®, and the
            associated logos are trademarks owned by CREA and identify real
            estate professionals who are members of CREA.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>© {year} Vicinus. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
