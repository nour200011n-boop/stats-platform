// ============================================================
// أدوات مشتركة بين كل صفحات المنصة
// ============================================================

const SUPER_ADMIN_EMAIL = "nour200011j@gmail.com";
const FEATURE_ADS_SYSTEM_KEY = "ads_system";
const FEATURE_VISITOR_PHOTO_KEY = "visitor_photo_upload";

function isSuperAdminEmail(email) {
  return !!email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function remainingDays(endDate) {
  if (!endDate) return 0;
  var end = endDate.toDate ? endDate.toDate() : new Date(endDate);
  var diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

function isSubscriptionActive(subscription) {
  if (!subscription || subscription.status !== "active" || !subscription.endDate) return false;
  var end = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
  return end.getTime() > Date.now();
}

// ---------------- تنبيه بسيط (Toast) ----------------
function showToast(message, isError) {
  var el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.toggle("toast-error", !!isError);
  el.classList.add("show");
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
}

// ---------------- الثيم (محلي على الجهاز — localStorage) ----------------
function loadTheme() {
  var saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  return saved;
}
function setTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem("theme", id);
}

// ---------------- حراسة الدخول ----------------
// تُستدعى أعلى كل صفحة محمية. تنتظر معرفة حالة تسجيل الدخول ثم تستدعي
// onReady(user, userData) — أو تُعيد التوجيه تلقائياً حسب الحالة.
function guardPage(options) {
  options = options || {};
  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    var snap = await db.collection("users").doc(user.uid).get();
    var data = snap.exists ? snap.data() : null;

    if (options.requireSuperAdmin) {
      if (!isSuperAdminEmail(user.email)) {
        window.location.href = "app.html";
        return;
      }
      options.onReady && options.onReady(user, data);
      return;
    }

    // مستخدم عادي: تحقّق من تسلسل الفتح -> إنشاء الصيدلية -> التطبيق
    var unlocked = data && data.unlockedUntil &&
      (data.unlockedUntil.toDate ? data.unlockedUntil.toDate() : new Date(data.unlockedUntil)) > new Date();

    if (!unlocked && !options.allowUnlockedCheckSkip) {
      window.location.href = "unlock.html";
      return;
    }
    if (!data || !data.pharmacyId) {
      if (!options.allowMissingPharmacy) {
        window.location.href = "unlock.html";
        return;
      }
    }

    options.onReady && options.onReady(user, data);
  });
}
