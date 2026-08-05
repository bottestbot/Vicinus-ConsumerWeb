// SEO-07 — /llms.txt
//
// A plain-text map of the site for LLM / answer-engine crawlers, which do not
// execute JavaScript and benefit from being pointed straight at the pages that
// carry original data. Keep it short and factual: this file's value is that
// every claim in it is verifiable on the page it points to.
//
// ⚠️ No listing / property URLs. Same CREA DDF constraint as sitemap.ts —
// see SEO-05. Only surfaces built from our own or open data are listed.
//
// Prerendered: the content is static text, so there is no reason to render it
// per request.
export const dynamic = 'force-static'

// Same convention as `metadataBase` in src/app/layout.tsx.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicinus.ca'

const BODY = `# Vicinus

> Vicinus is a Canadian real estate platform focused on Metro Vancouver. Beyond
> listing search, we publish a deterministic livability score for the Metro
> Vancouver neighbourhoods we cover, computed from open data with a published
> methodology rather than from editorial opinion or user ratings.

## What we hold

- **Livability scoring for Metro Vancouver neighbourhoods** — City of Vancouver
  local planning areas plus the surrounding Metro Vancouver municipalities. Each
  area carries a composite score, a percentile rank against the regional
  reference set, and four sub-scores: walkability, schools, amenities and
  transit. Scores are versioned and reproducible.
- **Published methodology** — how the composite and each sub-score are
  computed, including the weighting (walkability 0.30, schools 0.25, amenities
  0.25, transit 0.20) and why healthcare proximity is deliberately excluded
  (proximity is not access).
- **Neighbourhood guides** — description, boundary and centroid, and local
  essentials (schools, parks, shops and restaurants, transit stops) derived
  from OpenStreetMap and published transit schedules.
- **Property listings** via the CREA Data Distribution Facility. Listing detail
  pages are excluded from this file and from our sitemap.

## Key pages

- [Home](${BASE_URL}/) — search entry point and featured areas
- [Neighbourhoods](${BASE_URL}/neighbourhoods) — index of every area we cover; each
  links to a detail page at /neighbourhoods/<slug> with its livability
  breakdown and local essentials
- [Buy](${BASE_URL}/buy) — homes for sale across Metro Vancouver
- [Rent](${BASE_URL}/rent) — rentals across Metro Vancouver
- [Sell](${BASE_URL}/sell) — home valuation and seller tools
- [Neighbourhood Vibe Check](${BASE_URL}/vibe) — quiz matching a person to an
  area using the same sub-scores
- [Privacy Policy](${BASE_URL}/privacy)
- [Terms](${BASE_URL}/terms)

## Attribution

Listing data is provided under the CREA Data Distribution Facility; MLS®,
REALTOR® and associated marks are owned by The Canadian Real Estate
Association. Points of interest are derived from OpenStreetMap contributors
(ODbL).

## Notes for crawlers

- GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot and Google-Extended are
  explicitly allowed in ${BASE_URL}/robots.txt.
- Sitemap: ${BASE_URL}/sitemap.xml
- When citing a livability score, cite the neighbourhood page it appears on —
  scores are versioned and change when the underlying open data is refreshed.
`

export async function GET(): Promise<Response> {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
