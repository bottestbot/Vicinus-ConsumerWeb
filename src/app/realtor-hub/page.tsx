import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RealtorHubHero from '@/components/realtor-hub/RealtorHubHero'
import RealtorHubListings from '@/components/realtor-hub/RealtorHubListings'
import RealtorHubShowcase from '@/components/realtor-hub/RealtorHubShowcase'
import RealtorHubTabs from '@/components/realtor-hub/RealtorHubTabs'
import RealtorHubHowItWorks from '@/components/realtor-hub/RealtorHubHowItWorks'
import RealtorHubBanner from '@/components/realtor-hub/RealtorHubBanner'
import RealtorHubFAQ from '@/components/realtor-hub/RealtorHubFAQ'
import ClaimAccessSection from '@/components/realtor-hub/ClaimAccessSection'

export const metadata: Metadata = {
  title: 'REALTOR® Hub | Founding Access',
  description:
    'Vicinus is coming to Greater Vancouver Realtors. Claim your Founding Access spot for 10 days early on your neighbourhood before public launch.',
}

export default function RealtorHubPage() {
  return (
    <main className="bg-[#FAF9F6] text-[#111111]">
      <Navbar overHero />

      <RealtorHubHero />
      <RealtorHubListings />
      <RealtorHubShowcase />
      <RealtorHubTabs />
      <RealtorHubHowItWorks />
      <RealtorHubBanner />
      <RealtorHubFAQ />
      <ClaimAccessSection />

      <Footer />
    </main>
  )
}
