// ============================================================
// طبقة المنطق المشترك: الميزات، الإعلانات، تفعيل الاشتراك
// (يقابل services/ في نسخة Flutter — نفس المنطق، بلغة JS)
// ============================================================

async function getPharmacy(pharmacyId) {
  var snap = await db.collection("pharmacies").doc(pharmacyId).get();
  return snap.exists ? Object.assign({ id: snap.id }, snap.data()) : null;
}

// ---------------- الميزات الديناميكية (Feature Gating) ----------------

async function isFeatureEnabledGlobally(key) {
  var q = await db.collection("features").where("key", "==", key).limit(1).get();
  if (q.empty) return false;
  return !!q.docs[0].data().enabledGlobally;
}

async function isFeatureEnabledForPharmacy(key, pharmacyId) {
  var q = await db.collection("features").where("key", "==", key).limit(1).get();
  if (q.empty) return false;
  var feature = q.docs[0].data();
  if (!feature.enabledGlobally) return false;

  var pharmacy = await getPharmacy(pharmacyId);
  if (!pharmacy || !isSubscriptionActive(pharmacy.subscription)) return false;

  var linked = feature.linkedPlanIds || [];
  if (linked.length === 0) return true;
  return linked.indexOf(pharmacy.subscription.planId) > -1;
}

// ---------------- الإعلانات ----------------

async function getAdToShow(pharmacyId) {
  var adsEnabled = await isFeatureEnabledGlobally(FEATURE_ADS_SYSTEM_KEY);
  if (!adsEnabled) return null;

  var pharmacy = await getPharmacy(pharmacyId);
  if (!pharmacy) return null;

  if (isSubscriptionActive(pharmacy.subscription) && pharmacy.subscription.planId) {
    var planSnap = await db.collection("subscriptionPlans").doc(pharmacy.subscription.planId).get();
    if (planSnap.exists && planSnap.data().removeAds) return null;
  }

  var user = auth.currentUser;
  if (!user) return null;
  var userSnap = await db.collection("users").doc(user.uid).get();
  var userData = userSnap.exists ? userSnap.data() : {};
  var adViews = userData.adViews || {};
  var lastShownAdId = userData.lastShownAdId || null;

  var settingsSnap = await db.collection("adSettings").doc("config").get();
  var maxViewsPerUser = settingsSnap.exists ? (settingsSnap.data().maxViewsPerUser || 3) : 3;

  var activeAdsSnap = await db.collection("ads").where("active", "==", true).get();
  var eligible = [];
  activeAdsSnap.forEach(function (doc) {
    var ad = Object.assign({ id: doc.id }, doc.data());
    var targets = ad.targetProvinces || [];
    var matchesProvince = targets.length === 0 || targets.indexOf(pharmacy.province) > -1;
    var viewsForAd = adViews[ad.id] || 0;
    if (matchesProvince && viewsForAd < maxViewsPerUser) eligible.push(ad);
  });

  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];

  var candidates = eligible.filter(function (a) { return a.id !== lastShownAdId; });
  var pool = candidates.length ? candidates : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function recordAdView(adId) {
  var user = auth.currentUser;
  if (!user) return;
  var userRef = db.collection("users").doc(user.uid);
  var adRef = db.collection("ads").doc(adId);

  var update = {};
  update["adViews." + adId] = firebase.firestore.FieldValue.increment(1);
  update["lastShownAdId"] = adId;

  await db.runTransaction(async function (t) {
    t.set(userRef, update, { merge: true });
    t.update(adRef, { totalViews: firebase.firestore.FieldValue.increment(1) });
  });
}

// ---------------- تفعيل رمز اشتراك ----------------

async function activateSubscriptionCode(code, pharmacyId) {
  var codeRef = db.collection("activationCodes").doc(code);
  var pharmacyRef = db.collection("pharmacies").doc(pharmacyId);

  return db.runTransaction(async function (t) {
    var codeSnap = await t.get(codeRef);
    if (!codeSnap.exists) throw new Error("رمز التفعيل غير موجود.");
    var c = codeSnap.data();
    if (c.isCancelled) throw new Error("تم إلغاء هذا الرمز.");
    if ((c.usedCount || 0) >= c.maxUses) throw new Error("تم استنفاد عدد مرات استخدام هذا الرمز.");
    if (c.expiresAt && c.expiresAt.toDate() < new Date()) throw new Error("انتهت صلاحية هذا الرمز.");

    var pharmacySnap = await t.get(pharmacyRef);
    if (!pharmacySnap.exists) throw new Error("الصيدلية غير موجودة.");
    var pharmacy = pharmacySnap.data();
    var now = new Date();
    var queued = false;
    var newSub;

    if (isSubscriptionActive(pharmacy.subscription)) {
      newSub = Object.assign({}, pharmacy.subscription, {
        queuedPlanId: c.planId,
        queuedDurationDays: c.durationDays
      });
      queued = true;
    } else {
      newSub = {
        planId: c.planId,
        status: "active",
        startDate: firebase.firestore.Timestamp.fromDate(now),
        endDate: firebase.firestore.Timestamp.fromDate(new Date(now.getTime() + c.durationDays * 86400000)),
        queuedPlanId: null,
        queuedDurationDays: null
      };
    }

    t.update(pharmacyRef, { subscription: newSub });
    t.update(codeRef, {
      usedCount: firebase.firestore.FieldValue.increment(1),
      usageLog: firebase.firestore.FieldValue.arrayUnion({
        pharmacyId: pharmacyId,
        activatedAt: firebase.firestore.Timestamp.fromDate(now),
        queued: queued
      })
    });

    return { queued: queued };
  });
}

// ---------------- ضغط ورفع صورة (Storage) ----------------
// يضغط الصورة على جهاز المستخدم عبر canvas قبل رفعها، بدل رفعها بحجمها
// الكامل أو تخزينها كنص base64 داخل Firestore.
function compressImage(file, maxDimension) {
  maxDimension = maxDimension || 800;
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) { resolve(blob); }, "image/jpeg", 0.78);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadVisitorPhoto(pharmacyId, visitorId, file) {
  var blob = await compressImage(file, 800);
  var ref = storage.ref().child("pharmacies/" + pharmacyId + "/visitors/" + visitorId + "/photo.jpg");
  await ref.put(blob);
  return ref.getDownloadURL();
}
