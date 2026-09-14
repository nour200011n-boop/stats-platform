// ============================================================
// إعداد Firebase — عدّل القيم أدناه بمعلومات مشروعك الحقيقي
// ============================================================
// من أين تحصل عليها:
// Firebase Console → ⚙️ Project settings → أسفل الصفحة "Your apps"
// إن لم يكن لديك تطبيق ويب مُسجَّل بعد: اضغط "Add app" واختر أيقونة </>
// (Web)، سمِّه أي اسم، ثم انسخ كائن firebaseConfig الذي يظهر لك مباشرة
// إلى هنا (استبدل القيم التالية بالكامل).
//
// ملاحظة أمان: هذه القيم ليست سرّية — من الطبيعي والمتوقّع أن تكون
// مرئية داخل كود الواجهة الأمامية لأي تطبيق ويب. الحماية الفعلية تأتي
// من Firestore Security Rules (ملف firestore.rules)، وليس من إخفاء هذه
// القيم.

const firebaseConfig = {
  apiKey: "ضع_apiKey_هنا",
  authDomain: "ضع_authDomain_هنا",
  projectId: "ضع_projectId_هنا",
  storageBucket: "ضع_storageBucket_هنا",
  messagingSenderId: "ضع_messagingSenderId_هنا",
  appId: "ضع_appId_هنا"
};

firebase.initializeApp(firebaseConfig);

// مراجع جاهزة يستخدمها بقية الكود في كل الصفحات
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
