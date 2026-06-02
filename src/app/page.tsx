import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Vicinus | Luxury Canadian Real Estate',
  description: 'Beyond data. The Vicinus standard — intelligent curation of Canada\'s finest properties.',
}

export default function LandingPage() {
  return (
    <main className="bg-[var(--cream)] min-h-screen text-[var(--heading)]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-5xl font-heading font-light tracking-tight mb-4 text-[var(--heading)]">The Art of Intelligence in Living</h1>
          <p className="text-[var(--body)] text-lg">Beyond Data. The Vicinus Standard.</p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
