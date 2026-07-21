import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { RedisService } from '../../common/redis/redis.service'

// NBHD-03 — server-side Google Maps proxy. The API key never reaches the client;
// Static Maps / Street View URLs are built here and Places Nearby results are
// cached in Redis (24h) to respect the Places caching ToS and cut spend.
//
// Key resolution: prefer GOOGLE_MAPS_API_KEY, fall back to the existing
// GOOGLE_PLACES_API_KEY (a single Google Cloud key can serve Static Maps, Street
// View and Places if those APIs are enabled on it).
const STATIC_MAPS_URL = 'https://maps.googleapis.com/maps/api/staticmap'
const STREET_VIEW_URL = 'https://maps.googleapis.com/maps/api/streetview'
const PLACES_NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
const NEARBY_TTL = 24 * 60 * 60 // 24h, per Places caching ToS

export interface NearbyPlace {
  placeId: string
  name: string | null
  lat: number | null
  lng: number | null
}

@Injectable()
export class GoogleMapsProxyService {
  private readonly logger = new Logger(GoogleMapsProxyService.name)

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private get apiKey(): string | null {
    return (
      this.config.get<string>('GOOGLE_MAPS_API_KEY') ??
      this.config.get<string>('GOOGLE_PLACES_API_KEY') ??
      null
    )
  }

  getStaticMapUrl(lat: number, lng: number, zoom = 15, width = 640, height = 360): string {
    const key = this.apiKey
    // TODO: add GOOGLE_MAPS_API_KEY to api/.env
    if (!key) return placeholderUrl('static-map', lat, lng, width, height)
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: String(zoom),
      size: `${width}x${height}`,
      scale: '2',
      markers: `color:red|${lat},${lng}`,
      key,
    })
    return `${STATIC_MAPS_URL}?${params.toString()}`
  }

  getStreetViewUrl(lat: number, lng: number, width = 640, height = 360): string {
    const key = this.apiKey
    // TODO: add GOOGLE_MAPS_API_KEY to api/.env
    if (!key) return placeholderUrl('street-view', lat, lng, width, height)
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      size: `${width}x${height}`,
      key,
    })
    return `${STREET_VIEW_URL}?${params.toString()}`
  }

  /** Places Nearby, cached in Redis 24h. Fail-soft to []. */
  async getNearbyPlaces(
    lat: number,
    lng: number,
    type: string,
    radius = 1500,
  ): Promise<NearbyPlace[]> {
    const key = this.apiKey
    // TODO: add GOOGLE_MAPS_API_KEY to api/.env
    if (!key) return []

    const cacheKey = `gmaps:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${type}:${radius}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as NearbyPlace[]

    try {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type,
        key,
      })
      const response = await firstValueFrom(
        this.http.get<{ results?: GooglePlaceResult[] }>(`${PLACES_NEARBY_URL}?${params.toString()}`),
      )
      // Cache only place_id + coordinates + name, per Places caching ToS.
      const places: NearbyPlace[] = (response.data.results ?? []).map((r) => ({
        placeId: r.place_id,
        name: r.name ?? null,
        lat: r.geometry?.location?.lat ?? null,
        lng: r.geometry?.location?.lng ?? null,
      }))
      await this.redis.set(cacheKey, JSON.stringify(places), NEARBY_TTL)
      return places
    } catch (err) {
      this.logger.warn(`Places Nearby failed (${type}): ${(err as Error).message}`)
      return []
    }
  }
}

interface GooglePlaceResult {
  place_id: string
  name?: string
  geometry?: { location?: { lat?: number; lng?: number } }
}

// Deterministic placeholder so the FE renders a stable grey tile until a key is added.
function placeholderUrl(kind: string, lat: number, lng: number, width: number, height: number): string {
  return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(`${kind} ${lat.toFixed(3)},${lng.toFixed(3)}`)}`
}
