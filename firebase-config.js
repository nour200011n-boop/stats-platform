// ============================================================
// إعداد Firebase — بيانات مشروعك الحقيقية
// ============================================================
//
// ملاحظة أمان: هذه القيم ليست سرّية — من الطبيعي والمتوقّع أن تكون
// مرئية داخل كود الواجهة الأمامية لأي تطبيق ويب. الحماية الفعلية تأتي
// من Firestore Security Rules (ملف firestore.rules)، وليس من إخفاء هذه
// القيم.

const firebaseConfig = {
  apiKey: "AIzaSyC7VVvo57P_y2ndWRLo4kmt2TkisT4KmN4",
  authDomain: "stats-analysis-platform.firebaseapp.com",
  projectId: "stats-analysis-platform",
  storageBucket: "stats-analysis-platform.firebasestorage.app",
  messagingSenderId: "347756276194",
  appId: "1:347756276194:web:eb2f0162373a075430b1bb"
};

firebase.initializeApp(firebaseConfig);

// مراجع جاهزة يستخدمها بقية الكود في كل الصفحات
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
