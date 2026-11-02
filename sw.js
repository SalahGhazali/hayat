// Retire the offline worker from the previous hosted HAYAT version.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('hayat-shell-')).map(key => caches.delete(key))
    )),
    self.registration.unregister()
  ]));
});
