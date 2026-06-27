'use client'

import { useRouter } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <OnboardingWizard
      onComplete={() => router.push('/dashboard')}
      onSkip={() => router.push('/dashboard')}
    />
  )
}
