import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'LinkSOC - Controle Operacional',
        short_name: 'LinkSOC',
        description: 'Sistema de Controle Operacional e Etiquetas LinkSOC',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#EE4D2D',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192 512x512',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
