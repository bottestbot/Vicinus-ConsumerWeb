import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Vicinus account to access your saved properties and curated recommendations.',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
