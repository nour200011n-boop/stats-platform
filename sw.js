// ============================================================
// Service Worker — يخزّن ملفات التطبيق نفسها (الواجهة) للعمل بلا
// إنترنت. بيانات Firestore لها آلية تخزين مؤقت منفصلة خاصة بها
// (مفعّلة في firebase-config.js عبر enablePersistence) — هذا الملف
// لا يتدخل في طلبات الشبكة الخاصة بـ Firebase إطلاقاً، فقط في ملفات
// الواجهة الثابتة من نفس الموقع.
// ============================================================

// ملاحظة: عند تعديل أي ملف من ملفات التطبيق (HTML/CSS/JS)، غيّر رقم
// النسخة هنا (مثلاً v2, v3...) حتى يعرف المتصفح أن هناك تحديثاً جديداً
// يجب تنزيله وتخزينه بدل الاستمرار بالنسخة القديمة المحفوظة.
const CACHE_NAME = "pharmacy-records-v2";

const APP_SHELL = [
  "index.html",
  "unlock.html",
  "app.html",
  "admin.html",
  "styles.css",
  "shared.js",
  "platform.js",
  "firebase-config.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);

  // لا نتدخل إطلاقاً في أي طلب لغير نفس الموقع (Firebase, Google
  // Fonts, إلخ) — تُترك لتعمل بطريقتها الطبيعية دائماً.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  // Cache-first لملفات الواجهة: أسرع، ويعمل بلا إنترنت مباشرة.
  // إن وُجد اتصال، نحاول أيضاً تحديث النسخة المخزَّنة بصمت في الخلفية.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request).then(function (response) {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, response.clone());
          });
        }
        return response;
      }).catch(function () { return cached; });

      return cached || networkFetch;
    })
  );
});
