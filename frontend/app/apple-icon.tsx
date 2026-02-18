import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#003870',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    fontSize: 42,
                    fontWeight: 900,
                    textAlign: 'center',
                }}
            >
                iTravas
            </div>
        ),
        {
            ...size,
        }
    )
}
