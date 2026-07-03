import type { Metadata } from 'next'
import HomeNavbar from '@/components/landing/HomeNavbar'
import Footer from '@/components/layout/Footer'
import RealtorHubHero from '@/components/realtor-hub/RealtorHubHero'
import RealtorHubFeatures from '@/components/realtor-hub/RealtorHubFeatures'
import FoundingMemberBand from '@/components/realtor-hub/FoundingMemberBand'
import WaitlistForm from '@/components/realtor-hub/WaitlistForm'

export const metadata: Metadata = {
  title: 'Realtor Hub | Coming Soon',
  description:
    'Vicinus is coming for real estate professionals — the new intelligence layer for modern Realtors. Join the waitlist for founding-member early access.',
}

export default function RealtorHubPage() {
  return (
    <main className="bg-[#FAF9F6] text-[#111111]">
      <HomeNavbar />

      <RealtorHubHero />
      <RealtorHubFeatures />
      <FoundingMemberBand />

      {/* ── Join the Waitlist ─────────────────────────────────────────────── */}
      <section id="waitlist" className="scroll-mt-24 bg-[#FAF9F6] px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-4xl font-bold text-[#111111]">Join the Waitlist</h2>
            <p className="mt-3 text-sm text-[#6B6B6B]">
              Secure your spot in the next era of real estate intelligence.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}
