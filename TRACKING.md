# Tracking Documentation - Mohamed & Nada Wedding

## نظام التتبع الشامل للموقع

تم إضافة نظام tracking متكامل يتتبع كل التفاعلات على الموقع.

---

## 🔧 التكوين والإعداد

### 1. **Google Analytics ID**
ستحتاج إلى استبدال `G-XXXXXXXXXX` بـ Google Analytics ID الخاص بك:

**في `index.html`** (سطر ~25):
```html
<!-- استبدل G-XXXXXXXXXX بـ Analytics ID الحقيقي -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag('config', 'G-XXXXXXXXXX', {
    'allow_google_signals': false,
    'anonymize_ip': true
  });
</script>
```

**في `script.js`** (سطر ~50 و 56):
```javascript
// استبدل G-XXXXXXXXXX بـ Analytics ID الحقيقي في السطرين التاليين:
gtag('config', 'G-XXXXXXXXXX', { ... });
gtag('event', eventName, eventData);
```

### 2. الحصول على Google Analytics ID
1. اذهب إلى [Google Analytics](https://analytics.google.com/)
2. أنشئ حساب جديد أو استخدم الموجود
3. أنشئ property جديدة
4. ID سيكون بصيغة: `G-XXXXXXXXXX`

---

## 📊 الأحداث المتتبعة

### 1️⃣ **Page Views**
```
الحدث: "Page View"
البيانات: اسم الصفحة، الـ URL، الوقت
متى: عند تحميل الموقع
```

### 2️⃣ **Splash Dismissal** (إغلاق الترحيب)
```
الحدث: "splash_dismissed"
البيانات:
  - method: "button_click" أو "auto_timeout"
  - timestamp: وقت الإغلاق
```

### 3️⃣ **Mode Selection** (اختيار النمط)
```
الحدث: "mode_selection"
البيانات:
  - mode: "Marriage Contract" أو "Wedding Invitation"
  - timestamp: وقت الاختيار
```

### 4️⃣ **Music Interaction** (التفاعل مع الموسيقى)
```
الحدث: "music_interaction"
البيانات:
  - action: "muted" أو "unmuted"
  - timestamp: وقت التفاعل
```

### 5️⃣ **Doors Opening** (فتح الأبواب)
```
الحدث: "doors_opened"
البيانات:
  - timestamp: وقت الفتح
```

### 6️⃣ **Book Interaction** (التفاعل مع الكتاب)
```
الحدث: "book_interaction"
البيانات:
  - action: "opened" أو "closed"
  - timestamp: وقت التفاعل
```

### 7️⃣ **Calendar Save** (حفظ التذكيرات)
```
الحدث: "calendar_saved"
البيانات:
  - event_type: "reminder"
  - timestamp: وقت الحفظ
```

---

## 📈 عرض التقارير في Google Analytics

### الخطوات:
1. افتح [Google Analytics](https://analytics.google.com/)
2. اختر الـ Property الخاص بك
3. اذهب إلى **Reports** > **Realtime** لرؤية الزوار الحاليين
4. اذهب إلى **Reports** > **Events** لرؤية الأحداث المسجلة

### المقاييس المهمة:
- **Active Users**: عدد الزوار النشطين الآن
- **Total Events**: إجمالي الأحداث
- **Event Count**: عدد مرات كل حدث
- **Users**: عدد الزوار الفريدين

---

## 🔐 الخصوصية والأمان

✅ **تم تفعيل:**
- `anonymize_ip`: إخفاء عناوين IP الكاملة
- `allow_google_signals`: تعطيل الإشارات المتقدمة (احترام الخصوصية)

---

## 💻 الدالات المتاحة في Console

يمكنك استخدام هذه الدوال يدويًا في console للاختبار:

```javascript
// تتبع حدث مخصص
TRACKING.event('event_name', {
  'custom_param': 'value'
});

// تتبع صفحة
TRACKING.pageView('Page Name');

// تتبع اختيار النمط
TRACKING.trackModeSelection('katb');

// تتبع تشغيل الموسيقى
TRACKING.trackMusicToggle('muted');
```

---

## 🧪 الاختبار والتصحيح

### تفعيل وضع Debug:
في **Google Analytics**:
1. اذهب إلى **Admin** > **Account Settings**
2. فعّل **Debug Mode** للـ Property الخاص بك
3. استخدم **Realtime** للتحقق من الأحداث فوراً

### في Console:
ستظهر رسائل مثل:
```
[Tracking] Page View: Wedding Invitation - Mohamed & Nada
[Tracking] Event: mode_selection {mode: "Wedding Invitation", ...}
```

---

## 📝 ملاحظات مهمة

1. **الأحداث لن تظهر فوراً** - قد تستغرق ساعات لتظهر في التقارير
2. **الـ Realtime مهم** - استخدمه للتحقق الفوري من الأحداث
3. **تأكد من استبدال G-XXXXXXXXXX** - بخلاف ذلك لن يتم تسجيل الأحداث
4. **الزوار المحليون** - إذا كنت تختبر محليًا، قد لا تظهر الأحداث (Google قد تعتبرها بيانات غير صحيحة)

---

## 🎯 الخطوات التالية

1. ✅ استبدل `G-XXXXXXXXXX` بـ Analytics ID الحقيقي
2. ✅ جهّز الموقع للإطلاق
3. ✅ راقب البيانات في Google Analytics
4. ✅ حلل السلوك وحسّن التجربة

---

**Created with 💙 for Mohamed & Nada's Wedding**
