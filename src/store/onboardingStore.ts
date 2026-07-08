import { create } from 'zustand'

interface OnboardingStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

// Controls the global onboarding modal (see OnboardingModal + OnboardingGate).
// Opening is driven by the server's `showOnboarding` cadence; closing without
// completing simply dismisses it so it re-prompts on the next 5th session.
export const useOnboardingStore = create<OnboardingStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
