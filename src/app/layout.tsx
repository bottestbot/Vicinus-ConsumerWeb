import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import QueryProvider from '@/components/providers/QueryProvider'
import LocationProvider from '@/components/providers/LocationProvider'
import OnboardingGate from '@/components/onboarding/OnboardingGate'
import OnboardingModal from '@/components/onboarding/OnboardingModal'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="font-sans">
          <QueryProvider>
            <LocationProvider />
            <OnboardingGate />
            {children}
            <OnboardingModal />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
