//Files to cache when offline
const FILES_TO_CACHE = [
  "./index.html",
  "./css/styles.css",
  "./js/idb.js",
  "./js/index.js"
];
//
const APP_PREFIX = 'BudgetTracker';
const VERSION = '.v00.build00';
const CACHE_NAME = APP_PREFIX + VERSION;
// Install event to cache files the application will require using cache API.
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Installing cache: " + CACHE_NAME)
      return cache.addAll(FILES_TO_CACHE)
    })
  )
})
// Active event to clean up when new Service Worker is taking over.
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      let cacheKeeplist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX);
      });
      cacheKeeplist.push(CACHE_NAME);
      return Promise.all(
        keyList.map(function (key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log('Deleting cache: ' + keyList[i]);
            return caches.delete(keyList[i]);
          }
        }));
    })
  );
});
// Fetch request to handle request from APP to network
// Employing a cache first stratergy.
self.addEventListener('fetch', function (e) {
  console.log('Fetch request from APP: ' + e.request.url)
  e.respondWith(
    caches.match(e.request).then(function (request) {
      if (request) {
        console.log('Responding to APP fetch request with cached data: ' + e.request.url)
        return request
      } else {
        console.log('No cache available, Fetching from Network: ' + e.request.url)
        return fetch(e.request)
      }
    })
  )
});