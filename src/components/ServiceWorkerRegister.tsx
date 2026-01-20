'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registration successful with scope: ', registration.scope);
                })
                .catch((err) => {
                    console.error('Service Worker registration failed: ', err);
                });
        }
    }, []);

    return null;
}
