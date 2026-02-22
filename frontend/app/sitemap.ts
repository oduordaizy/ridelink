import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://itravas.com'

    return [
        {
            url: baseUrl,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/how-it-works`,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/auth/register`,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/auth/login`,
            changeFrequency: 'yearly',
            priority: 0.1,
        },
    ]
}