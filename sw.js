const CACHE_NAME = 'neet-prep-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://apis.google.com/js/api.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetch event for', event.request.url);
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }
                
                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // Return offline page for navigation requests
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Handle background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'sheet-sync') {
        event.waitUntil(
            // Handle sheet synchronization
            syncWithGoogleSheets()
        );
    }
});

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push event received');
    
    const options = {
        body: event.data ? event.data.text() : 'New study reminder!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: '/icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('NEET Prep', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper function for sheet synchronization
async function syncWithGoogleSheets() {
    try {
        // This would be implemented based on your specific sync needs
        console.log('Service Worker: Syncing with Google Sheets');
        
        // You can store sync data in IndexedDB and process it here
        // For now, we'll just log the sync attempt
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Sync failed', error);
        return Promise.reject(error);
    }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_SHEET_DATA') {
        // Cache sheet data for offline access
        const sheetData = event.data.data;
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.put('sheet-data', new Response(JSON.stringify(sheetData)));
            })
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sheet-sync-periodic') {
        event.waitUntil(syncWithGoogleSheets());
    }
});
