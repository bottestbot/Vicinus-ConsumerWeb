import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

// Shared OSM/Overpass client used by both POI ingestion (NBHD-02) and vibe
// metrics ingestion (VIBE-01). Centralises the mirror list, retry policy, and
// the User-Agent Overpass insists on so the two callers can't drift apart.
// ODbL attribution is required anywhere the returned data is surfaced.

// Overpass mirrors, tried in order. The main instance is frequently saturated
// (504 "server too busy"), so a run of any size needs somewhere else to go.
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]

// Overpass rejects requests carrying a generic library User-Agent with
// 406 Not Acceptable (axios sends "axios/<version>" by default). Their usage
// policy asks callers to identify themselves, so send something descriptive.
export const USER_AGENT = 'Vicinus/1.0 (+https://vicinus.ca; neighbourhood livability scoring)'

// Transient server-side conditions worth retrying rather than dropping the
// neighbourhood to no data.
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const MAX_ATTEMPTS_PER_ENDPOINT = 2

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  // Present when the query ends in `out geom;` — the full node list of a way.
  geometry?: { lat: number; lon: number }[]
  tags?: Record<string, string>
}

/**
 * POST an Overpass QL query, cycling through the mirrors and retrying transient
 * failures. `timeoutS` must match the `[timeout:N]` in the query. A self-hosted
 * `OVERPASS_URL` config, when set, is tried first. Never catches: the caller
 * must be able to tell a genuine "no results" from a failed fetch (a failed
 * fetch must not be recorded as "this area has nothing").
 */
export async function fetchOverpass(
  http: HttpService,
  config: ConfigService,
  query: string,
  timeoutS: number,
): Promise<OverpassElement[]> {
  const configured = config.get<string>('OVERPASS_URL')
  const endpoints = configured ? [configured, ...OVERPASS_ENDPOINTS] : OVERPASS_ENDPOINTS

  let lastError: Error = new Error('No Overpass endpoint attempted')
  for (const url of endpoints) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ENDPOINT; attempt++) {
      try {
        const response = await firstValueFrom(
          http.post<{ elements: OverpassElement[] }>(
            url,
            `data=${encodeURIComponent(query)}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': USER_AGENT,
              },
              // Overpass can be slow; cap total wait a little above its internal timeout.
              timeout: (timeoutS + 10) * 1000,
            },
          ),
        )
        return response.data?.elements ?? []
      } catch (err) {
        lastError = err as Error
        const status = (err as { response?: { status?: number } }).response?.status
        // A non-retryable status (e.g. 400 bad query) won't improve on retry
        // or on another mirror — surface it immediately.
        if (status !== undefined && !RETRYABLE_STATUS.has(status)) throw err
        if (attempt < MAX_ATTEMPTS_PER_ENDPOINT) await delay(attempt * 2000)
      }
    }
  }
  throw lastError
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
