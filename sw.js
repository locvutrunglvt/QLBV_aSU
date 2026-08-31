/**
 * SERVICE WORKER - QLBV
 *
 * Chiến lược:
 *  - Mã nguồn ứng dụng (HTML/CSS/JS): ƯU TIÊN MẠNG (network-first).
 *    Có mạng thì luôn lấy bản mới nhất, mất mạng mới dùng bản đã lưu.
 *    Trước đây dùng cache-first nên điện thoại giữ mãi bản cũ, deploy bản mới
 *    lên cũng không thấy thay đổi.
 *  - Ảnh, icon, font: ưu tiên cache (cache-first) cho nhẹ và nhanh.
 */
const VERSION = 'v3';
const SHELL_CACHE = `qlbv-shell-${VERSION}`;
const ASSET_CACHE = `qlbv-asset-${VERSION}`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/auth.js',
  './js/master_data.js',
  './js/camera.js',
  './js/storage.js',
  './js/pdf_export.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cho phép trang yêu cầu SW mới thay thế ngay lập tức
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isAppShell(url) {
  return /\.(?:html|css|js|json)$/.test(url.pathname) || url.pathname.endsWith('/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Không đụng vào POST và mọi lời gọi API Google Apps Script
  if (req.method !== 'GET' || req.url.includes('script.google.com')) return;

  const url = new URL(req.url);

  // 1. Mã nguồn ứng dụng: ưu tiên mạng, dự phòng cache khi mất sóng
  if (url.origin === self.location.origin && isAppShell(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 2. Ảnh / font / thư viện ngoài: ưu tiên cache cho nhanh và tiết kiệm 3G
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(ASSET_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
