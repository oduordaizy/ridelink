import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'iTravas',
        short_name: 'iTravas',
        description: 'Connecting drivers and passengers for affordable, secure rides.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#08A6F6',
        icons: [
            {
                src: '/page-logo.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/page-logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/page-logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
