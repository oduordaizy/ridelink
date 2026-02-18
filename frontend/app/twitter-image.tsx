import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'iTravas - Ridesharing for Everyone'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

const LOGO_BASE64 = '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'

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #08A6F6, #003870)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '40px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    }}
                >
                    <img
                        src={`data:image/png;base64,${LOGO_BASE64}`}
                        alt="iTravas"
                        style={{ width: '200px', height: 'auto' }}
                    />
                </div>
                <div
                    style={{
                        fontSize: 64,
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center',
                    }}
                >
                    iTravas
                </div>
                <div
                    style={{
                        fontSize: 32,
                        color: 'rgba(255,255,255,0.8)',
                        textAlign: 'center',
                        marginTop: '20px',
                    }}
                >
                    Reliable Ridesharing in Kenya
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
