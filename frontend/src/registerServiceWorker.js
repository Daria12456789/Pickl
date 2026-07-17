export function register() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('[SW] Service registration failed:', err);
        });
    });
  }
}
