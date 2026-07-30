import { ImageResponse } from 'next/og'
import type { VibeCheckResult } from '@/types/vibe-check'

// Shared renderer behind opengraph-image.tsx and twitter-image.tsx for
// /vibe/[shortId] (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §9-10) — both route
// conventions want the same 1200x630 card, just under different meta tags.
export const VIBE_SHARE_IMAGE_SIZE = { width: 1200, height: 630 }

export function vibeShareImageAlt(result: VibeCheckResult): string {
  return `${result.archetypeName} — ${result.matchPercent}% match with ${result.matchedNeighbourhood.name}, ${result.matchedNeighbourhood.city}`
}

// Baked directly onto the image (not just the surrounding text/caption) so the
// link survives platforms — Instagram Stories chief among them — that accept
// an image from the OS share sheet but silently drop the accompanying text/url.
const SHARE_LINK_LABEL = 'vicinus.ca/vibe'

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
          background: 'linear-gradient(135deg, #1C3829 0%, #2D5A3D 100%)',
          padding: '56px 64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              Vicinus
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: '#A3E635',
                marginLeft: 4,
                marginBottom: 6,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Vibe Check
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', marginTop: 24 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#A3E635',
            }}
          >
            You&apos;re a
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05, marginRight: 16 }}>
              The
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: '#1C3829',
                background: '#A3E635',
                padding: '0 20px',
                borderRadius: 12,
                lineHeight: 1.05,
                marginRight: 16,
              }}
            >
              {firstWord}
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
              {restWords.join(' ')}
            </div>
          </div>
          <div
            style={{
              fontSize: 26,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 20,
              maxWidth: 920,
            }}
          >
            {tagline}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 28 }}>
            {reasonChips.map((chip) => (
              <div
                key={chip}
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'rgba(255,255,255,0.12)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderRadius: 999,
                  padding: '10px 24px',
                  marginRight: 16,
                  marginTop: 12,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Your match
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
              {`${matchedNeighbourhood.name}, ${matchedNeighbourhood.city}`}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 140,
              height: 140,
              borderRadius: 140,
              background: '#A3E635',
              border: '6px solid rgba(255,255,255,0.9)',
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: '#1C3829', lineHeight: 1 }}>
              {`${matchPercent}%`}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#1C3829',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              Match
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.55)',
            marginTop: 18,
          }}
        >
          {SHARE_LINK_LABEL}
        </div>
      </div>
    ),
    { ...VIBE_SHARE_IMAGE_SIZE },
  )
}
