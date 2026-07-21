import type { Neighbourhood, Essential, NeighbourhoodAgent, NeighbourhoodListing } from '@/types/neighbourhood'
import type {
  NeighbourhoodDetailResponse,
  PoiItem,
  PropertySummary,
} from '@/types/neighbourhood-detail'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export interface NeighbourhoodSummarySection {
  heading: string
  points: string[]
}

export interface NeighbourhoodAiSummaryData {
  safety: NeighbourhoodSummarySection
  dailyLife: NeighbourhoodSummarySection
  schools: NeighbourhoodSummarySection
  growth: NeighbourhoodSummarySection
}

// Normalises both legacy {sections:[{title,text}]} and current {safety,dailyLife,schools,growth} shapes.
function normaliseAiResponse(raw: unknown): NeighbourhoodAiSummaryData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  // Current schema
  if (r['safety'] && r['dailyLife'] && r['schools'] && r['growth']) {
    return r as unknown as NeighbourhoodAiSummaryData
  }

  // Legacy schema: { sections: [{ title, text }] }
  if (Array.isArray(r['sections'])) {
    const titleKey: Record<string, keyof NeighbourhoodAiSummaryData> = {
      'Safety & Welcoming Vibe': 'safety',
      'Daily Life & Convenience': 'dailyLife',
      'Schools & Families': 'schools',
      'Growth & Prosperity': 'growth',
    }
    const out: Partial<NeighbourhoodAiSummaryData> = {}
    for (const s of r['sections'] as Array<{ title: string; text: string }>) {
      const key = titleKey[s.title]
      if (key) out[key] = { heading: s.title, points: [s.text] }
    }
    if (out.safety && out.dailyLife && out.schools && out.growth)
      return out as NeighbourhoodAiSummaryData
  }

  return null
}

export async function getNeighbourhoodAiSummary(slug: string): Promise<NeighbourhoodAiSummaryData | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/neighbourhood-summary/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return normaliseAiResponse(await res.json())
  } catch {
    return null
  }
}

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return fallback
    return res.json() as Promise<T>
  } catch {
    return fallback
  }
}

// ─── Mock data (Canadian luxury neighbourhoods) ───────────────────────────────

const MOCK_NEIGHBOURHOOD: Neighbourhood = {
  slug: 'rosedale',
  name: 'Rosedale',
  city: 'Toronto',
  province: 'ON',
  bio: 'Rosedale is one of Toronto\'s most prestigious and sought-after neighbourhoods, defined by winding tree-lined streets, grand Edwardian and Georgian estates, and immediate access to the ravine trail network. An enclave of understated luxury just minutes from Bloor-Yonge, with Yorkville\'s boutiques and galleries at its doorstep.',
  imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80',
  medianPrice: 4800000,
  walkScore: 85,
  transitScore: 90,
  schoolGrade: 'A+',
}

const MOCK_ESSENTIALS: Essential[] = [
  { id: '1', name: 'Rosedale Public School', category: 'education', distance: '0.3 km' },
  { id: '2', name: 'Branksome Hall', category: 'education', distance: '0.7 km' },
  { id: '3', name: 'York School', category: 'education', distance: '1.1 km' },
  { id: '4', name: 'Mount Sinai Hospital', category: 'healthcare', distance: '1.4 km' },
  { id: '5', name: 'Rosedale Medical Centre', category: 'healthcare', distance: '0.5 km' },
  { id: '6', name: 'Chorley Park', category: 'parks', distance: '0.2 km' },
  { id: '7', name: 'Moore Park Ravine', category: 'parks', distance: '0.4 km' },
  { id: '8', name: 'Pricefield Road Park', category: 'parks', distance: '0.6 km' },
  { id: '9', name: 'Taddle Creek Childcare', category: 'childcare', distance: '0.3 km' },
  { id: '10', name: 'Rosedale YMCA Kids', category: 'childcare', distance: '0.8 km' },
]

const MOCK_LISTINGS: NeighbourhoodListing[] = [
  { id: '1', address: '12 Cluny Drive', price: 5200000, beds: 4, baths: 5, imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', agentName: 'Sarah Chen', brokerageName: 'Sotheby\'s International Realty', mlsNumber: 'C8941234' },
  { id: '2', address: '74 Rowanwood Avenue', price: 4100000, beds: 5, baths: 4, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80', agentName: 'Marcus Williams', brokerageName: 'Engel & Völkers Toronto', mlsNumber: 'C8941235' },
  { id: '3', address: '18 Highland Avenue', price: 6800000, beds: 6, baths: 7, imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', agentName: 'Jennifer Liu', brokerageName: 'Christie\'s Real Estate', mlsNumber: 'C8941236' },
  { id: '4', address: '9 Dunbar Road', price: 3750000, beds: 4, baths: 3, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', agentName: 'David Park', brokerageName: 'Royal LePage Signature', mlsNumber: 'C8941237' },
  { id: '5', address: '56 Avoca Avenue', price: 4500000, beds: 5, baths: 5, imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80', agentName: 'Emily Rodriguez', brokerageName: 'RE/MAX Hallmark', mlsNumber: 'C8941238' },
]

const MOCK_AGENTS: NeighbourhoodAgent[] = [
  { id: '1', name: 'Sarah Chen', title: 'REALTOR®', listingsCount: 8, phone: '(416) 555-0192', email: 'sarah.chen@vicinus.ca' },
  { id: '2', name: 'Marcus Williams', title: 'REALTOR®', listingsCount: 5, phone: '(416) 555-0244', email: 'marcus.w@vicinus.ca' },
  { id: '3', name: 'Diana Rodriguez', title: 'Luxury Specialist, REALTOR®', listingsCount: 11, phone: '(416) 555-0312', email: 'diana.r@vicinus.ca' },
]

// ─── Backend → frontend shape mappers ─────────────────────────────────────────

interface ApiNeighbourhood {
  slug: string
  name?: string | null
  city?: string | null
  province?: string | null
  bio?: string | null
  heroImageUrl?: string | null
  photos?: string[]
  medianPrice?: number | null
  walkScore?: number | null
  transitScore?: number | null
  schoolGrade?: string | null
  lat?: number | null
  lng?: number | null
}

function mapNeighbourhood(n: ApiNeighbourhood): Neighbourhood {
  return {
    slug: n.slug,
    name: n.name ?? '',
    city: n.city ?? '',
    province: n.province ?? '',
    bio: n.bio ?? undefined,
    imageUrl: n.heroImageUrl ?? n.photos?.[0] ?? undefined,
    photos: n.photos ?? [],
    medianPrice: n.medianPrice ?? undefined,
    walkScore: n.walkScore ?? undefined,
    transitScore: n.transitScore ?? undefined,
    schoolGrade: n.schoolGrade ?? undefined,
    lat: n.lat ?? undefined,
    lng: n.lng ?? undefined,
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function getNeighbourhood(slug: string): Promise<Neighbourhood> {
  const data = await apiFetch<ApiNeighbourhood | null>(`/neighbourhoods/${slug}`, null)
  if (!data || !data.name) {
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return { slug, name, city: '', province: '' }
  }
  return mapNeighbourhood(data)
}


const LISTING_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'

interface ApiListing {
  id: string
  listingKey?: string
  address?: string | null
  city?: string | null
  listPrice?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  mainPhotoUrl?: string | null
  agentName?: string | null
  brokerageName?: string | null
  realtorUrl?: string | null
  listingUrl?: string | null
}

function mapListing(l: ApiListing): NeighbourhoodListing {
  return {
    id: l.id,
    address: l.address ?? l.city ?? 'Address unavailable',
    price: l.listPrice ?? 0,
    beds: l.bedrooms ?? 0,
    baths: l.bathrooms ?? 0,
    imageUrl: l.mainPhotoUrl || LISTING_FALLBACK_IMAGE,
    agentName: l.agentName ?? undefined,
    brokerageName: l.brokerageName ?? undefined,
    mlsNumber: l.listingKey ?? undefined,
    // DDF ListingURL — deep-links the "Powered by REALTOR.ca" badge. Was
    // previously dropped even though the type + PropertyCell already support it.
    realtorUrl: l.realtorUrl ?? l.listingUrl ?? undefined,
  }
}

const CATEGORY_MAP: Record<string, Essential['category']> = {
  education: 'education',
  school: 'education',
  healthcare: 'healthcare',
  health: 'healthcare',
  park: 'parks',
  parks: 'parks',
  childcare: 'childcare',
}

interface ApiEssential {
  id: string
  name?: string | null
  category?: string | null
  distanceKm?: number | null
  distance?: string | null
}

function mapEssential(e: ApiEssential): Essential | null {
  const category = CATEGORY_MAP[(e.category ?? '').toLowerCase()]
  if (!category) return null // FE only renders the four known categories
  const distance =
    e.distance ?? (e.distanceKm != null ? `${e.distanceKm.toFixed(1)} km` : '—')
  return { id: e.id, name: e.name ?? 'Unnamed', category, distance }
}

export async function getNeighbourhoodListings(slug: string): Promise<NeighbourhoodListing[]> {
  const data = await apiFetch<ApiListing[]>(`/neighbourhoods/${slug}/listings`, [])
  return data.map(mapListing)
}

export async function getNeighbourhoodEssentials(slug: string): Promise<Essential[]> {
  const data = await apiFetch<ApiEssential[]>(`/neighbourhoods/${slug}/essentials`, [])
  return data.map(mapEssential).filter((e): e is Essential => e !== null)
}

export async function getNeighbourhoodAgents(slug: string): Promise<NeighbourhoodAgent[]> {
  return apiFetch<NeighbourhoodAgent[]>(`/neighbourhoods/${slug}/agents`, [])
}

export async function getNeighbourhoods(): Promise<Neighbourhood[]> {
  const data = await apiFetch<ApiNeighbourhood[]>('/neighbourhoods', [])
  // Return real data only. Previously fell back to MOCK_NEIGHBOURHOODS on an
  // empty response, which leaked 6 fake neighbourhoods into prod (their slugs
  // 404 on click). The client renders a proper empty state for [] instead.
  return data.map(mapNeighbourhood)
}

// ─── Aggregate detail endpoint (NBHD-09) ──────────────────────────────────────
// Serves the redesigned detail page in one call. The backend is being built in
// parallel; until `/neighbourhoods/:slug/detail` ships, `getNeighbourhoodDetail`
// composes the response from today's live endpoints so the page renders real
// data now. When the real endpoint lands, `apiFetch` returns it verbatim and the
// composition path is simply never hit — the swap is a no-op for callers.

const DETAIL_FALLBACK_HERO =
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80'

/** School letter grade → 0–100, for the composed livability blend. */
function gradeToScore(grade?: string | null): number {
  if (!grade) return 75
  const map: Record<string, number> = {
    'A+': 97, A: 93, 'A-': 90,
    'B+': 87, B: 83, 'B-': 80,
    'C+': 77, C: 73, 'C-': 70,
    'D+': 67, D: 63, 'D-': 60,
    F: 50,
  }
  return map[grade.trim().toUpperCase()] ?? 75
}

/** "0.3 km" / "320 m" → metres. Best-effort parse for the composed POIs. */
function distanceToMetres(distance: string): number {
  const m = distance.match(/([\d.]+)\s*(km|m)?/i)
  if (!m) return 0
  const value = parseFloat(m[1])
  if (Number.isNaN(value)) return 0
  return /km/i.test(m[2] ?? '') ? Math.round(value * 1000) : Math.round(value)
}

function essentialToPoi(e: Essential): PoiItem {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    lat: 0,
    lng: 0,
    distanceM: distanceToMetres(e.distance),
  }
}

function listingToSummary(l: NeighbourhoodListing): PropertySummary {
  return {
    id: l.id,
    address: l.address,
    price: l.price,
    beds: l.beds,
    baths: l.baths,
    sqft: 0, // not carried on NeighbourhoodListing; real /detail supplies it
    imageUrl: l.imageUrl,
    slug: l.id,
    realtorUrl: l.realtorUrl,
    agentName: l.agentName,
    brokerageName: l.brokerageName,
    mlsNumber: l.mlsNumber,
  }
}

// Livability blend weights — mirrors the deterministic backend composite
// (Walk 0.30 · Schools 0.25 · Amenities 0.25 · Transit 0.20). Healthcare is
// intentionally excluded (proximity ≠ access). See [[project_livability_scoring]].
const LIVABILITY_WEIGHTS_VERSION = 'compose-v1'

function composeDetail(
  n: Neighbourhood,
  essentials: Essential[],
  listings: NeighbourhoodListing[],
): NeighbourhoodDetailResponse {
  const walkability = n.walkScore ?? 0
  const transit = n.transitScore ?? null
  const schools = gradeToScore(n.schoolGrade)
  const amenities = walkability // proxy until real amenities sub-score exists

  // Weighted mean over the sub-scores we actually have (renormalise when transit
  // is absent so a missing GTFS area isn't penalised to 0).
  const parts: Array<[number, number]> = [
    [walkability, 0.3],
    [schools, 0.25],
    [amenities, 0.25],
  ]
  if (transit != null) parts.push([transit, 0.2])
  const weightSum = parts.reduce((s, [, w]) => s + w, 0)
  const score = weightSum > 0 ? Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / weightSum) : 0

  const byCategory = {
    schools: essentials.filter((e) => e.category === 'education').map(essentialToPoi),
    healthcare: essentials.filter((e) => e.category === 'healthcare').map(essentialToPoi),
    parks: essentials.filter((e) => e.category === 'parks').map(essentialToPoi),
    shopAndEat: [] as PoiItem[], // no shop/eat category in the legacy essentials feed
  }

  // Cold-start personalization: no signed-in user context here, so isPersonalized
  // is false and the reason chips are derived from the area's *actual* strengths
  // (never fabricated user history). The AI fit card renders its cold-start
  // variant. Real per-user match data arrives from NBHD-08 via the /detail endpoint.
  const reasonChips: string[] = []
  if (walkability >= 80) reasonChips.push(`Walk score ${walkability} · walk-everywhere`)
  else if (walkability >= 60) reasonChips.push(`Walkable · score ${walkability}`)
  if (schools >= 75) reasonChips.push('Strong school access')
  if (amenities >= 80) reasonChips.push('Amenities close by')
  if (transit != null && transit >= 70) reasonChips.push(`Transit score ${transit}`)

  return {
    neighbourhood: {
      id: n.slug,
      slug: n.slug,
      name: n.name,
      city: n.city,
      description: n.bio ?? '',
      heroImageUrl: n.imageUrl || DETAIL_FALLBACK_HERO,
      flavors: [],
      centroidLat: n.lat ?? 0,
      centroidLng: n.lng ?? 0,
    },
    marketSnapshot: {
      medianPrice: n.medianPrice ?? 0,
      priceChange30d: 0, // unknown from legacy endpoints
      daysOnMarket: 0,
      activeListings: listings.length,
    },
    livability: {
      score,
      // 0 = unknown here; the panel hides the "Top X%" line until the real
      // /detail endpoint supplies a true percentile rank across the reference set.
      percentile: 0,
      breakdown: { walkability, schools, amenities, transit },
      region: null,
      weightsVersion: LIVABILITY_WEIGHTS_VERSION,
    },
    localEssentials: byCategory,
    localInfoTiles: { staticMapUrl: null, streetViewUrl: null },
    liveListings: listings.slice(0, 6).map(listingToSummary),
    personalization: {
      matchPercent: 0,
      reasonChips: reasonChips.slice(0, 3),
      cautionChips: [],
      isPersonalized: false,
    },
  }
}

export async function getNeighbourhoodDetail(slug: string): Promise<NeighbourhoodDetailResponse> {
  const direct = await apiFetch<NeighbourhoodDetailResponse | null>(
    `/neighbourhoods/${slug}/detail`,
    null,
  )
  if (direct && direct.neighbourhood) return direct

  // Fallback: compose from the live endpoints so the page works pre-NBHD-09.
  const [n, essentials, listings] = await Promise.all([
    getNeighbourhood(slug),
    getNeighbourhoodEssentials(slug),
    getNeighbourhoodListings(slug),
  ])
  return composeDetail(n, essentials, listings)
}

