/* Service worker minimal mais fonctionnel.
 *
 * Stratégie volontairement conservatrice pour éviter le piège classique du
 * cache qui sert du contenu périmé après un déploiement :
 * - HTML, API (/api/, /auth/) : jamais mis en cache, toujours réseau direct.
 *   C'est le contenu qui change sans changer d'URL — le cacher casserait
 *   les déploiements (utilisateurs bloqués sur une ancienne version).
 * - Assets statiques hashés (/assets/*.js, *.css, images...) : cache-first
 *   avec mise à jour en arrière-plan (stale-while-revalidate). Sûr car
 *   Vite change le nom de fichier à chaque build (content hash) — une
 *   ancienne entrée de cache ne peut jamais être servie à la place d'un
 *   nouveau build, elle devient simplement inutilisée.
 */

const CACHE_VERSION = 'kilimo-static-v1';
const STATIC_ASSET_RE = /\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/;

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		Promise.all([
			self.clients.claim(),
			caches.keys().then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_VERSION)
						.map((name) => caches.delete(name))
				)
			),
		])
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	if (!STATIC_ASSET_RE.test(url.pathname)) return; // HTML/API : réseau direct, pas d'interception

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
