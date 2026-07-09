import { ImageResponse } from 'next/og'

// Default social share image — the Vicinus wordmark with the lime full-stop.
export const alt = 'Vicinus — the intelligent curator of luxury Canadian real estate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1C3829',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 168, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
            Vicinus
          </div>
          {/* Round lime full-stop (brand guide §02) */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 30,
              background: '#A3E635',
              marginLeft: 8,
              marginBottom: 8,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          The Intelligent Curator
        </div>
      </div>
    ),
    { ...size },
  )
}
