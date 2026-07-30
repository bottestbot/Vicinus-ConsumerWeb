'use client'

import { useEffect } from 'react'
import { useSearchStore } from '@/store/searchStore'
import { reverseGeocodeCity } from '@/lib/geocode'

export default function LocationProvider() {
  const { setUserLocation, setMapCenter } = useSearchStore()

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setMapCenter({ latitude, longitude, zoom: 11 })
      setUserLocation(null, { latitude, longitude })

      const city = await reverseGeocodeCity(latitude, longitude)
      setUserLocation(city, { latitude, longitude })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
