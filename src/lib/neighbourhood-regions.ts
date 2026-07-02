/**
 * Maps BC regions to the city names that appear in the Neighbourhood table.
 * Used to determine which featured neighbourhoods to show based on the user's
 * last searched city or geolocated city.
 */
export const REGION_CITIES: Record<string, string[]> = {
  'Metro Vancouver': [
    'Vancouver', 'Burnaby', 'Surrey', 'Richmond', 'Coquitlam', 'Delta',
    'Langley', 'Maple Ridge', 'New Westminster', 'North Vancouver',
    'Pitt Meadows', 'Port Coquitlam', 'Port Moody', 'Tsawwassen',
    'West Vancouver', 'White Rock', 'Anmore', 'Belcarra', 'Bowen Island',
    'Lions Bay',
  ],
  'Victoria': [
    'Victoria', 'Oak Bay', 'Saanich', 'Esquimalt', 'Langford',
    'Colwood', 'Sidney', 'Sooke', 'View Royal',
  ],
  'Okanagan': [
    'Kelowna', 'West Kelowna', 'Lake Country', 'Penticton', 'Vernon', 'Peachland',
  ],
  'Fraser Valley': ['Abbotsford', 'Chilliwack', 'Mission', 'Hope'],
  'Vancouver Island': [
    'Nanaimo', 'Courtenay', 'Campbell River', 'Parksville', 'Qualicum Beach', 'Duncan',
  ],
  'Interior BC': ['Kamloops', 'Merritt'],
  'Northern BC': ['Prince George'],
}

// Editorial fallback — shown when no search or location context is available.
// These are recognisable BC (Vancouver westside) neighbourhoods that exist in
// the seeded Neighbourhood table.
export const EDITORIAL_FEATURED_SLUGS = [
  'kitsilano',
  'shaughnessy',
  'kerrisdale',
  'dunbar-southlands',
  'arbutus-ridge',
]

/**
 * Given a city or neighbourhood name (from the search query or geolocation),
 * returns the list of city names that belong to the same region.
 * Returns null if no region match is found.
 */
export function getRegionCities(cityOrQuery: string): string[] | null {
  const q = cityOrQuery.toLowerCase().trim()
  for (const cities of Object.values(REGION_CITIES)) {
    if (cities.some((c) => c.toLowerCase() === q)) {
      return cities
    }
  }
  return null
}
