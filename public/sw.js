/* Minimal service worker for dev/prod without precache. */
self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// Pas de mise en cache agressive en dev. Laisser passer les requêtes.
self.addEventListener('fetch', () => {
	// no-op: network passthrough
});


