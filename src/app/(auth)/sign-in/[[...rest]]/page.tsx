'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      fallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: '#1C3829',
          colorBackground: '#F5F3EE',
          colorInputBackground: '#ECEAE4',
          colorText: '#111111',
          colorTextSecondary: '#6B6B6B',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'shadow-none bg-transparent',
          headerTitle: 'font-heading',
        },
      }}
    />
  )
}
