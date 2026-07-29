import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import QueryProvider from '@/components/providers/QueryProvider'
import LocationProvider from '@/components/providers/LocationProvider'
import LeadInquiryProvider from '@/components/providers/LeadInquiryProvider'
import OnboardingGate from '@/components/onboarding/OnboardingGate'
import OnboardingModal from '@/components/onboarding/OnboardingModal'
import SavedPropertiesGate from '@/components/providers/SavedPropertiesGate'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Brand wordmark — Space Grotesk Bold with the lime full-stop (brand guide §02).
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicinus.ca'),
  title: {
    default: 'Vicinus | Luxury Canadian Real Estate',
    template: '%s | Vicinus',
  },
  description: 'Vicinus — the intelligent curator of luxury Canadian real estate. Beyond data. The Vicinus standard.',
  openGraph: {
    siteName: 'Vicinus',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="font-sans">
          <QueryProvider>
            <LeadInquiryProvider>
              <LocationProvider />
              <OnboardingGate />
              <SavedPropertiesGate />
              {children}
              <OnboardingModal />
            </LeadInquiryProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
