import { ImageResponse } from 'next/og'
import type { VibeCheckResult } from '@/types/vibe-check'

// Shared renderer behind opengraph-image.tsx and twitter-image.tsx for
// /vibe/[shortId] (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §9-10) — both route
// conventions want the same 1200x630 card, just under different meta tags.
//
// Design: "cream poster" (chosen from 3 concepts in design review) — cream is
// the whole field, forest green is ink (headline text + a small trophy badge),
// lime is a highlight accent, not a colour field. A prior version used a big
// lime panel as the background shape; this one deliberately has none, so
// there's no "keep text out of the shape" geometry to manage at all.
export const VIBE_SHARE_IMAGE_SIZE = { width: 1200, height: 630 }

export function vibeShareImageAlt(result: VibeCheckResult): string {
  return `${result.archetypeName} — ${result.matchPercent}% match with ${result.matchedNeighbourhood.name}, ${result.matchedNeighbourhood.city}`
}

// Baked directly onto the image (not just the surrounding text/caption) so the
// link survives platforms — Instagram Stories chief among them — that accept
// an image from the OS share sheet but silently drop the accompanying text/url.
const SHARE_LINK_LABEL = 'vicinus.ca/vibe'

const CREAM = '#FAF9F6'
const FOREST = '#1C3829'
const LIME = '#A3E635'
const INK = '#111111'
const MUTED = '#5B6057'

export function renderVibeShareImage(result: VibeCheckResult): ImageResponse {
  const { archetypeName, tagline, matchedNeighbourhood, matchPercent, reasonChips } = result
  const [firstWord, ...restWords] = archetypeName.replace(/^The\s+/i, '').split(' ')

  // NOTE: matchedNeighbourhood.photoUrl (a raw Neighbourhood.photos[0] Google
  // Places CDN URL) is deliberately NOT used as a background here — confirmed
  // these URLs 403 on any server-side fetch (no browser session), even with a
  // spoofed browser User-Agent/Referer, so Satori's image fetch always fails
  // silently. Only the resolved CDN URL is stored, not the photo_reference
  // needed to mint a fresh one via the Places Photo API, so this needs a real
  // re-ingestion + photo-proxy fix, not a renderer change — likely affects
  // NeighbourhoodFlavors.tsx's next/image usage of the same field too.

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: CREAM,
          padding: '48px 60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: FOREST, lineHeight: 1 }}>Vicinus</div>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: LIME,
              marginLeft: 4,
              marginBottom: 4,
            }}
          />
        </div>

        <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: FOREST, marginTop: 26 }}>
          you&apos;re the
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 6, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              color: FOREST,
              background: LIME,
              padding: '2px 20px',
              borderRadius: 14,
              lineHeight: 1.05,
              marginRight: 20,
              marginTop: 8,
            }}
          >
            {firstWord}
          </div>
          {restWords.length > 0 && (
            <div style={{ fontSize: 74, fontWeight: 700, color: FOREST, lineHeight: 1.05, marginTop: 8 }}>
              {restWords.join(' ')}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 25,
            color: MUTED,
            marginTop: 22,
            maxWidth: 780,
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 26 }}>
          {reasonChips.map((chip) => (
            <div
              key={chip}
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: FOREST,
                background: '#FFFFFF',
                border: `2px solid ${FOREST}`,
                borderRadius: 999,
                padding: '9px 22px',
                marginRight: 14,
                marginTop: 10,
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 20 }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: INK }}>
              {`${matchedNeighbourhood.name}, ${matchedNeighbourhood.city}`}
            </div>
            <div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: '#8A8C86', marginTop: 6 }}>
              {SHARE_LINK_LABEL}
            </div>
          </div>

          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 150,
              background: FOREST,
              border: `6px solid ${LIME}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-8deg)',
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              {`${matchPercent}%`}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: LIME,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              Match
            </div>
          </div>
        </div>
      </div>
    ),
    { ...VIBE_SHARE_IMAGE_SIZE },
  )
}
