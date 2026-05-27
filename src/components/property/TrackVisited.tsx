'use client'

// FE-412: Track visited property on page load (client component wrapper)
import { useTrackVisited } from '@/hooks/useTrackVisited'

interface TrackVisitedProps {
  propertyId: string
}

export default function TrackVisited({ propertyId }: TrackVisitedProps) {
  useTrackVisited(propertyId)
  return null // renders nothing — side-effect only
}
