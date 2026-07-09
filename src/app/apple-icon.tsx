import { ImageResponse } from 'next/og'

// Apple touch icon — Vicinus "V." monogram on the brand dark-green.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1C3829',
          borderRadius: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div
            style={{
              fontSize: 118,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            V
          </div>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 20,
              background: '#A3E635',
              marginLeft: 4,
              marginBottom: 18,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
