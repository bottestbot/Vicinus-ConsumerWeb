// Mock Vibe Check result data. No backend exists yet — the matching engine is
// being built in parallel (see NEIGHBOURHOOD_VIBE_CHECK_PRD.md §6, §8). This
// stands in for a future `getVibeCheckResult(shortId)` API call: same shape,
// same call signature, so wiring in real data later is a one-line swap in
// src/app/vibe/[shortId]/page.tsx.
import type { VibeCheckResult } from '@/types/vibe-check'

const MOCK_RESULT: Omit<VibeCheckResult, 'shortId'> = {
  archetypeKey: 'transit-maximalist',
  archetypeName: 'The transit maximalist',
  tagline:
    "Car-free and proud of it — you want a bus or train close enough that the schedule barely matters.",
  matchedNeighbourhood: { name: 'Commercial Drive', city: 'Vancouver, BC' },
  matchPercent: 88,
  reasonChips: ['Steps from transit', 'Easy downtown access', 'Low car dependency'],
  matchRarityPct: 9,
  runnerUps: [
    { name: 'Metrotown, Burnaby', matchPercent: 84 },
    { name: 'Downtown, New Westminster', matchPercent: 81 },
  ],
  accentColour: 'lime-forest',
}

export function getMockVibeCheckResult(shortId: string): VibeCheckResult {
  return { shortId, ...MOCK_RESULT }
}
