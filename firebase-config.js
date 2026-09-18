// ============================================================
// إعداد Firebase — بيانات مشروعك الحقيقية (pharmacy-records-6a234)
// ============================================================
//
// ملاحظة أمان: هذه القيم ليست سرّية — من الطبيعي والمتوقّع أن تكون
// مرئية داخل كود الواجهة الأمامية لأي تطبيق ويب. الحماية الفعلية تأتي
// من Firestore Security Rules (ملف firestore.rules)، وليس من إخفاء هذه
// القيم.

const firebaseConfig = {
  apiKey: "AIzaSyBvITUcJRSc5rpE6CIbTkqU5Jt1EAEiqcI",
  authDomain: "pharmacy-records-6a234.firebaseapp.com",
  projectId: "pharmacy-records-6a234",
  storageBucket: "pharmacy-records-6a234.firebasestorage.app",
  messagingSenderId: "992397049141",
  appId: "1:992397049141:web:20a04bd0670031b966607c"
};

firebase.initializeApp(firebaseConfig);

// مراجع جاهزة يستخدمها بقية الكود في كل الصفحات
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ============================================================
// تفعيل العمل بلا إنترنت: يُخزَّن كل ما تمت قراءته محلياً على الجهاز،
// وأي حفظ يحدث بلا اتصال يُوضع بقائمة انتظار ويُرفع تلقائياً بمجرد
// عودة الاتصال — بلا أي كود إضافي مطلوب لهذا الجزء، Firestore يديره
// بنفسه. synchronizeTabs يمنع تعارضاً لو فتح المستخدم أكثر من تبويب.
// ============================================================
db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence: multiple tabs, continuing without it in this tab.");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence not supported in this browser.");
  }
});

// تسجيل Service Worker لتفعيل خاصية تثبيت التطبيق (PWA) والعمل بلا
// إنترنت لملفات الواجهة نفسها.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function (err) {
      console.warn("Service worker registration failed:", err);
    });
  });
}
