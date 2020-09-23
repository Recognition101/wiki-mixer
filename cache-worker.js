const cacheId = 'cache-worker-v1';
const selfUnknown = /** @type {unknown} */(self);
const serviceWorker = /** @type {ServiceWorkerGlobalScope} */(selfUnknown);

const isLongLived = /(data.drinks\.js|\.jpg|\.jpeg|\.png)$/i;

const baseFiles = [
    // HTML, CSS, and Data Files
    './index.html',
    './style.css',
    './data/',
    './data/drinks.js',

    // JS Files
    './src/',
    './src/main.js',
    './src/dispatcher.js',
    './src/segmentedControl.js',
    './src/shelf.js',
    './src/drinks.js',
    './src/filter.js',

    './lib/',

    // Lib: Snabbdom
    './lib/snabbdom/',
    './lib/snabbdom/jsx.js',
    './lib/snabbdom/is.js',
    './lib/snabbdom/init.js',
    './lib/snabbdom/h.js',
    './lib/snabbdom/htmldomapi.js',
    './lib/snabbdom/vnode.js',
    './lib/snabbdom/modules/',
    './lib/snabbdom/modules/style.js',
    './lib/snabbdom/modules/attributes.js',
    './lib/snabbdom/modules/props.js',
    './lib/snabbdom/modules/class.js'
    //'./lib/snabbdom/tovnode.js',                  // Unused (isomorphic)
    //'./lib/snabbdom/hooks.js',                    // Empty File
    //'./lib/snabbdom/thunk.js',                    // Unused (optimization)
    //'./lib/snabbdom/helpers/attachto.js',         // Unused (portals)
    //'./lib/snabbdom/modules/eventlisteners.js',   // Unused (dispatcher)
    //'./lib/snabbdom/modules/module.js',           // Empty File
    //'./lib/snabbdom/modules/hero.js',             // Unused
    //'./lib/snabbdom/modules/dataset.js',          // Unused (dispatcher)
];

/**
 * Gets a response from the cache, fetching a response upon a cache miss.
 * @param {Request} request the request to lookup in the cache
 * @return {Promise<Response>} the response, either from the cache or network
 */
const cacheGet = async request => {
    const cache = await caches.open(cacheId);
    const cacheResponse = await cache.match(request);
    if (cacheResponse) {
        return cacheResponse;
    } else {
        const response = await fetch(request);
        await cache.put(request, response.clone());
        return response;
    }
};

/**
 * Fetches a fresh response from the internet and caches the result.
 * @param {Request} request the request to fetch from the internet
 * @return {Promise<void>} a promise that resolves when the result is cached
 */
const cacheRefresh = async request => {
    if (!isLongLived.test(request.url)) {
        const cache = await caches.open(cacheId);
        const response = await fetch(request);
        await cache.put(request, response);
    }
};

serviceWorker.addEventListener('install', ev => {
    ev.waitUntil(caches.open(cacheId).then(cache => cache.addAll(baseFiles)));
});

serviceWorker.addEventListener('fetch', ev => {
    ev.respondWith(cacheGet(ev.request));
    ev.waitUntil(cacheRefresh(ev.request));
});
