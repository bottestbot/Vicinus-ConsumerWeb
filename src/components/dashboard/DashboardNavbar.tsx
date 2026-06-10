'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const NAV_LINKS = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Search', href: '/search' },
  { label: 'Neighbourhoods', href: '/neighbourhoods' },
  { label: 'Saved', href: '/dashboard#saved' },
  { label: 'Messages', href: '/dashboard#messages' },
]

export default function DashboardNavbar() {
  const pathname = usePathname()
  const { user } = useUser()

  const firstName = user?.firstName ?? 'Account'
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName
    ? user.firstName[0].toUpperCase()
    : 'A'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="font-heading text-xl text-[#1C3829] shrink-0">
          Vicinus
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/dashboard' && pathname === '/dashboard'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors pb-0.5 ${
                  isActive
                    ? 'text-[#111111] font-semibold border-b-2 border-[#111111]'
                    : 'text-[#6B6B6B] hover:text-[#111111]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-4">
          {/* Bell icon with notification badge */}
          <button className="relative p-2 text-[#6B6B6B] hover:text-[#111111] transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#1C3829] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              3
            </span>
          </button>

          {/* User avatar + name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1C3829] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <span className="hidden sm:block text-sm text-[#6B6B6B] font-medium">Account</span>
          </div>
        </div>
      </div>
    </header>
  )
}
