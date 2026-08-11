/* Service worker minimal mais fonctionnel.
 *
 * Stratégie volontairement conservatrice pour éviter le piège classique du
 * cache qui sert du contenu périmé après un déploiement :
 * - API (/api/, /auth/) : jamais mis en cache, toujours réseau direct.
 *   Ces données doivent toujours être fraîches (stock, prix, session...).
 * - Assets statiques hashés (/assets/*.js, *.css, images...) : cache-first
 *   avec mise à jour en arrière-plan (stale-while-revalidate). Sûr car
 *   Vite change le nom de fichier à chaque build (content hash) — une
 *   ancienne entrée de cache ne peut jamais être servie à la place d'un
 *   nouveau build, elle devient simplement inutilisée.
 * - Navigation (changement de page) : réseau d'abord — jamais de HTML
 *   périmé tant qu'une connexion existe. Le cache ne sert que de secours
 *   hors-ligne (dernière version de CETTE page déjà visitée, sinon
 *   /offline.html) ; c'est le seul cas où du HTML est mis en cache.
 */

const CACHE_VERSION = 'kilimo-static-v1';
const NAV_CACHE = 'kilimo-nav-v1';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSET_RE = /\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/;

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			try {
				const cache = await caches.open(NAV_CACHE);
				await cache.add(OFFLINE_URL);
			} catch (err) {
				console.error('[SW] Failed to precache offline page:', err);
			}
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		Promise.all([
			self.clients.claim(),
			caches.keys().then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_VERSION && name !== NAV_CACHE)
						.map((name) => caches.delete(name))
				)
			),
		])
	);
});

async function handleNavigation(request) {
	const cache = await caches.open(NAV_CACHE);
	try {
		const response = await fetch(request);
		if (response.ok) cache.put(request, response.clone());
		return response;
	} catch (err) {
		const cached = await cache.match(request);
		return cached || (await cache.match(OFFLINE_URL));
	}
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigation(request));
		return;
	}

	if (!STATIC_ASSET_RE.test(url.pathname)) return;

	event.respondWith(
		caches.open(CACHE_VERSION).then(async (cache) => {
			const cached = await cache.match(request);
			const network = fetch(request)
				.then((response) => {
					if (response.ok) cache.put(request, response.clone());
					return response;
				})
				.catch(() => cached);

			return cached || network;
		})
	);
});

// --- Notifications push ---
self.addEventListener('push', (event) => {
	let payload = { title: 'KILIMO', body: '' };
	try {
		if (event.data) payload = { ...payload, ...event.data.json() };
	} catch {
		if (event.data) payload.body = event.data.text();
	}

	event.waitUntil(
		self.registration.showNotification(payload.title || 'KILIMO', {
			body: payload.body || '',
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			data: { url: payload.url || '/' },
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const targetUrl = event.notification.data?.url || '/';

	event.waitUntil(
		(async () => {
			const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const existing = clientsList.find((c) => new URL(c.url).pathname === targetUrl);
			if (existing) {
				existing.focus();
				return;
			}
			await self.clients.openWindow(targetUrl);
		})()
	);
});
