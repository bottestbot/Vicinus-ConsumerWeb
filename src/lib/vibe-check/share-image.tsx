import { ImageResponse } from 'next/og'
import type { VibeCheckResult } from '@/types/vibe-check'

// Shared renderer behind opengraph-image.tsx and twitter-image.tsx for
// /vibe/[shortId] (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §9-10) — both route
// conventions want the same 1200x630 card, just under different meta tags.
//
// Design intent: Spotify-Wrapped-style share card, not a property brochure —
// the archetype name is the punchline and dominates the frame; the match% is
// a sticker/trophy, not a metric readout; a big rotated lime panel gives the
// brand's fun colour real area instead of a thin accent. Still the same
// cream/forest/lime palette as the rest of the app — no per-archetype hues.
export const VIBE_SHARE_IMAGE_SIZE = { width: 1200, height: 630 }

export function vibeShareImageAlt(result: VibeCheckResult): string {
  return `${result.archetypeName} — ${result.matchPercent}% match with ${result.matchedNeighbourhood.name}, ${result.matchedNeighbourhood.city}`
}

// Baked directly onto the image (not just the surrounding text/caption) so the
// link survives platforms — Instagram Stories chief among them — that accept
// an image from the OS share sheet but silently drop the accompanying text/url.
const SHARE_LINK_LABEL = 'vicinus.ca/vibe'

// Alternating tilt per chip (not all the same angle) is what reads as
// "stickers someone slapped on" rather than a re-skinned data table.
const CHIP_TILTS = [-3, 2, -2]

// Hard cap on the text column so title/tagline/chips can never run under the
// lime panel, however long the archetype name or tagline get.
const TEXT_SAFE_WIDTH = 640

export function renderVibeShareImage(result: VibeCheckResult): ImageResponse {
  const { archetypeName, tagline, matchedNeighbourhood, matchPercent, reasonChips } = result
  const [firstWord, ...restWords] = archetypeName.replace(/^The\s+/i, '').split(' ')
  // Every archetype's distinguishing word is 5-12 chars except one outlier —
  // "Everything-in-Reach" (20) — which wraps onto two lines inside its own
  // highlight pill at full size and pushes the chips off the bottom of the
  // frame. Scale down rather than special-case that one archetype by name.
  const titleFontSize = firstWord.length > 14 ? 52 : 76

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
          position: 'relative',
          background: '#173224',
        }}
      >
        {/* The big lime panel — bleeds off the top-right corner, rotated, so
            the brand's fun colour carries real area instead of a thin accent.
            Sits behind everything else via document order, not z-index (Satori
            has no z-index support). */}
        <div
          style={{
            position: 'absolute',
            top: -320,
            right: -280,
            width: 700,
            height: 700,
            borderRadius: 96,
            background: '#A3E635',
            transform: 'rotate(20deg)',
          }}
        />

        {/* Content layer. Hard-capped at TEXT_SAFE_WIDTH so nothing — title,
            tagline, or chips — can ever run under the lime panel regardless of
            copy length; the panel's diagonal edge reaches roughly x=680-720 at
            the height this column occupies, so 660 leaves a clean margin. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 60px 40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              Vicinus
            </div>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 7,
                background: '#A3E635',
                marginLeft: 3,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: TEXT_SAFE_WIDTH }}>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 600,
                color: '#A3E635',
                marginTop: 30,
              }}
            >
              You&apos;re a...
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: titleFontSize, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05, marginRight: 18 }}>
                The
              </div>
              <div
                style={{
                  fontSize: titleFontSize,
                  fontWeight: 700,
                  color: '#173224',
                  background: '#A3E635',
                  padding: '0 20px',
                  borderRadius: 16,
                  lineHeight: 1.05,
                  marginRight: 18,
                  marginTop: 8,
                  transform: 'rotate(-2deg)',
                }}
              >
                {firstWord}
              </div>
              {restWords.length > 0 && (
                <div style={{ fontSize: titleFontSize, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05, marginTop: 8 }}>
                  {restWords.join(' ')}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 25,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 22,
                lineHeight: 1.4,
              }}
            >
              {tagline}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 28 }}>
              {reasonChips.map((chip, i) => (
                <div
                  key={chip}
                  style={{
                    fontSize: 21,
                    fontWeight: 600,
                    color: '#173224',
                    background: '#FAF9F6',
                    borderRadius: 999,
                    padding: '10px 24px',
                    marginRight: 16,
                    marginTop: 10,
                    transform: `rotate(${CHIP_TILTS[i % CHIP_TILTS.length]}deg)`,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 20 }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#FFFFFF' }}>
              {`Matched with ${matchedNeighbourhood.name}, ${matchedNeighbourhood.city}`}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 10,
              }}
            >
              {SHARE_LINK_LABEL}
            </div>
          </div>
        </div>

        {/* The match% sticker — sits on top of the lime panel, rotated the
            opposite way to the panel for a layered, slapped-on-after feel. */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 64,
            width: 190,
            height: 190,
            borderRadius: 190,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#173224',
            border: '7px solid #FAF9F6',
            transform: 'rotate(-11deg)',
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, color: '#A3E635', lineHeight: 1 }}>
            {`${matchPercent}%`}
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginTop: 6,
            }}
          >
            Match
          </div>
        </div>
      </div>
    ),
    { ...VIBE_SHARE_IMAGE_SIZE },
  )
}
