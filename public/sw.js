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
			// Nettoyer les anciens caches si nécessaire
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						// Ne pas supprimer les caches actifs
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
	
	// Ne pas intercepter les requêtes vers d'autres origines (comme localhost:4000)
	// Le service worker ne peut gérer que les requêtes de la même origine
	if (url.origin !== self.location.origin) {
		// Laisser passer les requêtes cross-origin sans interception
		// Le navigateur les gérera directement
		return;
	}
	
	// Pour les requêtes de la même origine, laisser passer au réseau sans interception
	// Ne pas utiliser event.respondWith pour éviter les erreurs si la requête échoue
	// Le navigateur gérera la requête normalement
});


