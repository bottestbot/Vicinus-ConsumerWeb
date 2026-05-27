import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import QueryProvider from '@/components/providers/QueryProvider'
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
  title: 'Vicinus — The Intelligent Curator',
  description: 'A world where property data meets intelligence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="font-sans">
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
