// FE-601: Dashboard page — protected, server component
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import type { DashboardData } from '@/types/dashboard'
import Navbar from '@/components/layout/Navbar'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import FeaturedProperty from '@/components/dashboard/FeaturedProperty'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import SavedProperties from '@/components/dashboard/SavedProperties'
import OpenHouseSchedule from '@/components/dashboard/OpenHouseSchedule'
import VisitedProperties from '@/components/dashboard/VisitedProperties'

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

  // Onboarding is handled globally by <OnboardingGate> (root layout), which pings
  // the session and opens the onboarding modal over the current route when due —
  // so there's no per-page ping or redirect here anymore.
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
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Welcome banner + recent searches */}
        <WelcomeBanner data={safeData} />

        {/* Left rail (Featured + Saved + Schedule) + full-height Notifications panel,
            stretched to match the combined height of the left rail rather than just
            the Featured Property card. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 flex flex-col gap-10">
            {featuredProperty ? (
              <FeaturedProperty property={featuredProperty} />
            ) : (
              <div className="rounded-2xl border border-[#E8E6E1] bg-white flex items-center justify-center h-72 text-sm text-[#6B6B6B]">
                No featured property yet — save a listing to get started.
              </div>
            )}

            {/* Saved properties carousel */}
            <div className="border-t border-[#E8E6E1] pt-10">
              <SavedProperties saved={safeData.saved} />
            </div>

            {/* Open house schedule (FE-821) — client component, own useOpenHouseVisits() fetch */}
            <div className="border-t border-[#E8E6E1] pt-10">
              <OpenHouseSchedule />
            </div>
          </div>
          <div className="lg:col-span-1">
            <NotificationsPanel />
          </div>
        </div>

        {/* Recently viewed properties */}
        <div className="border-t border-[#E8E6E1] pt-10 pb-16">
          <VisitedProperties visited={safeData.visited} />
        </div>

      </div>
    </div>
  )
}
