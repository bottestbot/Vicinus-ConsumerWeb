import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

/**
 * Auth shell — identical on desktop and mobile: the site navbar on top, the
 * Clerk widget centred in the viewport, and a slim legal line underneath.
 * (Replaces the old split-screen photo panel, which only existed on ≥lg.)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EE] font-ui">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-[#E8E6E1] px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-[11px] text-[#9B9B9B]">
          <span>© {year} VicinityProptech Inc.</span>
          <Link href="/privacy" className="hover:text-[#6B6B6B] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
