import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 22,
                    fontWeight: 900,
                    background: '#003870',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                iT
            </div>
        ),
        {
            ...size,
        }
    )
}
