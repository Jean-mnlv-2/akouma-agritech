/* Minimal service worker for dev/prod without precache. */
self.addEventListener('install', (event) => {
	event.waitUntil(
		self.skipWaiting().catch((err) => {
			console.error('[SW] Install error:', err);
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		Promise.all([
			self.clients.claim().catch((err) => {
				console.error('[SW] Claim error:', err);
			}),
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						return Promise.resolve();
					})
				);
			}).catch((err) => {
				console.error('[SW] Cache cleanup error:', err);
			})
		])
	);
});

// Pas de mise en cache agressive en dev. Laisser passer les requêtes.
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	
	if (url.origin !== self.location.origin) {

		return;
	}
	
});


