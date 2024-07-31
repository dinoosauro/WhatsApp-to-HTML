const cacheName = 'whatsapphtml-cache';
const filestoCache = [
    './',
    './index.html',
    './icon.svg',
    './icon.png',
    './loadContent.js',
    './style.css',
    './manifest.json',
    './assets/index.js',
    './assets/jszip.min.js',
];
let language = navigator.language || navigator.userLanguage;
if (language.indexOf("it") !== -1) filestoCache.push('./translationItems/it.json')
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(filestoCache))
    );
});
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.url.indexOf("updatecode") !== -1) return fetch(req); else event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
    try {
        const networkResponse = await fetch(req);
        const cache = await caches.open('whatsapphtml-cache');
        await cache.delete(req);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(req);
        return cachedResponse;
    }
}