// FE-601: Dashboard page — protected, server component
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import type { DashboardData } from '@/types/dashboard'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import FeaturedProperty from '@/components/dashboard/FeaturedProperty'
import VecinusPanel from '@/components/dashboard/VecinusPanel'
import SavedProperties from '@/components/dashboard/SavedProperties'
import VisitedProperties from '@/components/dashboard/VisitedProperties'
import EditorialCurations from '@/components/dashboard/EditorialCurations'

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Your saved properties, recent visits, and curated recommendations.',
}

async function fetchDashboard(token: string): Promise<DashboardData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'}/users/me/dashboard`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    return res.json() as Promise<DashboardData>
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const { userId, getToken } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const token = await getToken()
  const data = token ? await fetchDashboard(token) : null

  // Fallback data when API is unavailable
  const safeData: DashboardData = data ?? {
    user: { id: '', clerkId: userId, email: '', fullName: null, avatarUrl: null, role: 'buyer' },
    saved: [],
    visited: [],
    editorial: [],
  }

  // Pick first saved property as featured recommendation, else first visited
  const featuredProperty =
    safeData.saved[0]?.property ?? safeData.visited[0]?.property ?? null

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Welcome banner */}
        <WelcomeBanner data={safeData} />

        {/* Two-column: featured property + agent panel */}
        {featuredProperty ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-3">
                Featured Listing
              </p>
              <FeaturedProperty property={featuredProperty} />
            </div>
            <div className="lg:col-span-1">
              <VecinusPanel />
            </div>
          </div>
        ) : (
          <VecinusPanel />
        )}

        {/* Saved properties grid */}
        <div className="border-t border-[#E8E6E1] pt-10">
          <SavedProperties saved={safeData.saved} />
        </div>

        {/* Recently visited horizontal scroll */}
        <div className="border-t border-[#E8E6E1] pt-10">
          <VisitedProperties visited={safeData.visited} />
        </div>

        {/* Editorial curations — dark section */}
        <div className="border-t border-[#E8E6E1] pt-10">
          <EditorialCurations editorial={safeData.editorial} />
        </div>

      </div>
    </div>
  )
}
