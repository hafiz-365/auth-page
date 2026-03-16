# تفاصيل تقنية - نظام Forgot Password

## معمارية النظام

```
┌─────────────────┐
│  صفحة الدخول    │
│   /auth/login   │
└────────┬────────┘
         │
         │ انقر على "Forgot password?"
         │
         ▼
┌─────────────────────────────────┐
│   صفحة طلب إعادة التعيين        │
│   /auth/forgot-password         │
│                                 │
│  • إدخال البريد الإلكتروني      │
│  • التحقق من الصيغة             │
│  • استدعاء API                  │
└────────┬────────────────────────┘
         │
         │ POST /api/auth/forgot-password
         │
         ▼
┌─────────────────────────────────┐
│   Supabase Auth Service         │
│                                 │
│ • التحقق من البريد الإلكتروني  │
│ • إنشاء access_token            │
│ • إرسال بريل إلكتروني          │
└────────┬────────────────────────┘
         │
         │ بريل إلكتروني يحتوي على:
         │ /auth/reset-password
         │ ?type=recovery
         │ &access_token=xyz
         │
         ▼
┌─────────────────────────────────┐
│  المستخدم يفتح البريل ويضغط     │
│  على الرابط                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   صفحة تغيير كلمة المرور        │
│   /auth/reset-password          │
│                                 │
│  • استخراج access_token من URL │
│  • إدخال كلمة المرور الجديدة   │
│  • تأكيد كلمة المرور           │
│  • استدعاء API مع Token        │
└────────┬────────────────────────┘
         │
         │ POST /api/auth/reset-password
         │ Header: Authorization: Bearer {token}
         │ Body: { password, confirmPassword }
         │
         ▼
┌─────────────────────────────────┐
│   Supabase Auth Service         │
│                                 │
│ • التحقق من access_token       │
│ • تحديث كلمة المرور            │
│ • إنهاء جميع الجلسات القديمة   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   رسالة النجاح                  │
│                                 │
│  ✓ تم تغيير كلمة المرور        │
│  • زر "Go to sign in"           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  صفحة الدخول    │
│   /auth/login   │
└─────────────────┘
```

## تفاصيل API Endpoints

### 1. POST /api/auth/forgot-password

**الطلب:**
```json
{
  "email": "user@example.com"
}
```

**الردّ (نجاح):**
```json
{
  "message": "If an account with this email exists, you will receive a password reset link shortly.",
  "email": "user@example.com"
}
```

**الردّ (خطأ - بريد غير صحيح):**
```json
{
  "error": "Invalid email address"
}
Status: 400
```

**العملية الداخلية:**
1. التحقق من صيغة البريد الإلكتروني
2. استدعاء `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. Supabase ينشئ `access_token`
4. Supabase يرسل بريل إلكتروني يحتوي على:
   ```
   http://localhost:3000/auth/reset-password
   ?type=recovery
   &access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   &refresh_token=...
   ```

### 2. POST /api/auth/reset-password

**الطلب:**
```
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body:
{
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**الردّ (نجاح):**
```json
{
  "message": "Password updated successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    ...
  }
}
Status: 200
```

**الردّ (خطأ - لا يوجد token):**
```json
{
  "error": "No access token provided"
}
Status: 401
```

**الردّ (خطأ - كلمات لا تتطابق):**
```json
{
  "error": "Passwords do not match"
}
Status: 400
```

**العملية الداخلية:**
1. استخراج `access_token` من Header
2. التحقق من صحة البيانات (طول، تطابق)
3. إنشاء Supabase client بـ access token
4. استدعاء `supabase.auth.updateUser({ password })`
5. Supabase يحدث كلمة المرور
6. Supabase ينهي جميع الجلسات القديمة تلقائياً

## معالجة الأخطاء

### في Frontend (صفحة Reset Password)

```typescript
// التحقق من وجود access_token
const accessToken = searchParams.get('access_token')
const type = searchParams.get('type')

if (type === 'recovery' && !accessToken) {
  // رابط غير صحيح أو منتهي الصلاحية
  setErrors({ form: 'Invalid or expired reset link...' })
  // عرض زر "Request a new reset link"
}
```

### في Backend (API)

```typescript
// التحقق من صيغة البريد
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
}

// التحقق من طول كلمة المرور
if (password.length < 8) {
  return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
}

// التحقق من وجود token
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'No access token provided' }, { status: 401 })
}
```

## متغيرات البيئة المطلوبة

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## الأمان والالتزام

### ✓ Best Practices المتبعة:

1. **عدم حفظ Tokens:**
   - `access_token` يتم استخراجه من URL فقط
   - لا يتم حفظه في State مباشرة بطريقة غير آمنة
   - يتم تمريره عبر Header فقط

2. **Validation الشامل:**
   - التحقق من البريل الإلكتروني على الكلاينت والسيرفر
   - التحقق من طول كلمة المرور
   - التحقق من تطابق الكلمات

3. **معالجة الأخطاء الآمنة:**
   - لا نكشف إذا كان البريل موجود أم لا (في forgot-password)
   - رسائل خطأ عامة للأمان

4. **استخدام HTTPS:**
   - توصيات بـ HTTPS في الإنتاج
   - `access_token` محمي أثناء النقل

5. **صلاحية محدودة:**
   - `access_token` صالح لمدة ساعة واحدة فقط
   - يتم إنهاء الجلسات القديمة تلقائياً

## الفروقات بين الصفحات

### صفحة Forgot Password
```
الدخول: بريل إلكتروني فقط
الخروج: رسالة تأكيد
API: resetPasswordForEmail()
```

### صفحة Reset Password
```
الدخول: كلمة المرور + access_token من URL
الخروج: رسالة نجاح أو خطأ
API: updateUser()
```

## الفترات الزمنية

| العملية | الفترة الزمنية |
|--------|--------------|
| إرسال البريل الإلكتروني | فوري |
| استقبال البريل | 30 ثانية - دقيقة واحدة |
| صلاحية الرابط | 60 دقيقة |
| انتهاء الجلسة القديمة | فوري بعد تحديث الكلمة |

## ملفات مهمة

| الملف | الغرض |
|------|-------|
| `app/api/auth/forgot-password/route.ts` | معالجة طلب إعادة التعيين |
| `app/api/auth/reset-password/route.ts` | معالجة تحديث الكلمة |
| `app/auth/forgot-password/page.tsx` | واجهة طلب الإعادة |
| `app/auth/reset-password/page.tsx` | واجهة تحديث الكلمة |
| `SUPABASE_CONFIG_GUIDE.md` | إعدادات Supabase |

## الخطوات القادمة (اختيارية)

- [ ] إضافة تصور للعد التنازلي قبل السماح بإعادة الإرسال
- [ ] إضافة تسجيل الأنشطة (Logging)
- [ ] إضافة اختبارات تلقائية
- [ ] إضافة تتبع التحليلات (Analytics)
