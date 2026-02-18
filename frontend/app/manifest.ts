import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iTravas',
        short_name: 'iTravas',
        description: 'Connect with drivers and passengers for affordable, secure rides.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#08A6F6',
        icons: [
            {
                src: '/logo2.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
