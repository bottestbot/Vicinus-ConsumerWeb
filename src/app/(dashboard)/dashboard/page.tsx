// FE-601: Dashboard page — protected, server component
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import type { DashboardData } from '@/types/dashboard'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import FeaturedProperty from '@/components/dashboard/FeaturedProperty'
import IntelligencePanel from '@/components/dashboard/IntelligencePanel'
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

  const featuredProperty =
    safeData.saved[0]?.property ?? safeData.visited[0]?.property ?? null

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Dashboard-specific navbar (no main site nav) */}
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Welcome banner + recent searches */}
        <WelcomeBanner data={safeData} />

        {/* Two-column hero: Featured property (2/3) + Intelligence panel (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            {featuredProperty ? (
              <FeaturedProperty property={featuredProperty} />
            ) : (
              <div className="rounded-2xl border border-[#E8E6E1] bg-white flex items-center justify-center h-72 text-sm text-[#6B6B6B]">
                No featured property yet — save a listing to get started.
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <IntelligencePanel />
          </div>
        </div>

        {/* Saved properties carousel */}
        <div className="border-t border-[#E8E6E1] pt-10">
          <SavedProperties saved={safeData.saved} />
        </div>

        {/* Visited properties */}
        <div className="border-t border-[#E8E6E1] pt-10">
          <VisitedProperties visited={safeData.visited} />
        </div>

        {/* Editorial curations — dark section */}
        <div className="border-t border-[#E8E6E1] pt-10 pb-16">
          <EditorialCurations editorial={safeData.editorial} />
        </div>

      </div>
    </div>
  )
}
