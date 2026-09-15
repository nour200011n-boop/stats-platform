// ============================================================
// إعداد Firebase — بيانات مشروعك المخصص الجديد (pharmacy-records)
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
