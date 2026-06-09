import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1C3829] text-white/60 text-xs py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-white/80 text-sm">Vicinus</span>
          <span>© {new Date().getFullYear()} Vicinus. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-white/90 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/search" className="hover:text-white/90 transition-colors">
            Properties
          </Link>
          <Link href="/neighbourhoods" className="hover:text-white/90 transition-colors">
            Neighbourhoods
          </Link>
        </div>
      </div>
    </footer>
  )
}
