import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Vicinus — your intelligent curator of luxury Canadian real estate.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
