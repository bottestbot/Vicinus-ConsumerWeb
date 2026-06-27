'use client'

import { useEffect } from 'react'
import { useSearchStore } from '@/store/searchStore'

export default function LocationProvider() {
  const { setUserLocation, setMapCenter } = useSearchStore()

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setMapCenter({ latitude, longitude, zoom: 11 })
      setUserLocation(null, { latitude, longitude })

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'Vicinus/1.0' } },
        )
        const json = await res.json()
        const city =
          json.address?.city ||
          json.address?.town ||
          json.address?.village ||
          json.address?.county ||
          null
        setUserLocation(city, { latitude, longitude })
      } catch {
        // city stays null, coords already set
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
