# دليل إعدادات Supabase - Password Reset و Email

هذا الدليل يشرح كيفية إعداد Supabase بشكل صحيح لأنظمة الـ Authentication المختلفة.

## الروابط المطلوبة (Redirect URLs)

اذهب إلى **Authentication > URL Configuration** في لوحة تحكم Supabase وأضف الروابط التالية:

### 1. **Site URL** (الرابط الرئيسي للتطبيق)
```
http://localhost:3000          # للتطوير المحلي
https://yourdomain.com         # للإنتاج
```

### 2. **Redirect URLs** (روابط إعادة التوجيه)
أضف الروابط التالية تحت "Redirect URLs":

```
http://localhost:3000/auth/login
http://localhost:3000/auth/reset-password
https://yourdomain.com/auth/login
https://yourdomain.com/auth/reset-password
```

## متغيرات البيئة المطلوبة

تأكد من أن لديك المتغيرات التالية في ملف `.env.local`:

```env
# Supabase URLs و Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# لـ Redirect في Password Reset
NEXT_PUBLIC_APP_URL=http://localhost:3000  # للتطوير
# أو
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # للإنتاج
```

## إعدادات البريد الإلكتروني

### 1. **Enable Email Authentication**
   - اذهب إلى **Authentication > Providers**
   - تأكد من أن "Email" مفعّل

### 2. **Email Templates** (مهم جداً!)

يجب تفعيل وتخصيص Email Templates في Supabase:

#### أ) Confirm signup (التأكيد من البريد الإلكتروني)
- الذهاب إلى: **Authentication > Email Templates > Confirm signup**
- تأكد من وجود رابط مشابه:
```
{{ .ConfirmationURL }}
```

#### ب) Reset password (استعادة كلمة المرور)
- الذهاب إلى: **Authentication > Email Templates > Reset password**
- تأكد من وجود رابط مشابه:
```
{{ .ConfirmationURL }}
```

**ملاحظة مهمة:** الرابط في Email Template يجب أن يتوجه إلى صفحة Reset Password مثل:
```
http://localhost:3000/auth/reset-password
https://yourdomain.com/auth/reset-password
```

### 3. **Custom Email**
إذا أردت تخصيص رسالة البريد الإلكتروني:
- اذهب إلى **Authentication > Email Templates**
- اختر "Reset password" وعدّل النص والتصميم
- تأكد من الاحتفاظ بـ `{{ .ConfirmationURL }}` في الرابط

## تدفق Forgot Password الكامل

### 1. **صفحة طلب إعادة تعيين كلمة المرور**
```
/auth/forgot-password
```
- المستخدم يدخل بريده الإلكتروني
- يتم إرسال طلب إلى `/api/auth/forgot-password`
- API يستدعي `supabase.auth.resetPasswordForEmail()`
- يتم إرسال بريد إلكتروني يحتوي على رابط Reset

### 2. **بريد إلكتروني**
- يحتوي على رابط يشبه:
```
http://localhost:3000/auth/reset-password?type=recovery&access_token=xyz&refresh_token=abc
```

### 3. **صفحة إعادة تعيين كلمة المرور**
```
/auth/reset-password
```
- تستخرج `access_token` من URL
- المستخدم يدخل كلمة المرور الجديدة
- يتم إرسال `access_token` في Header مع كلمة المرور الجديدة
- API يحدث كلمة المرور باستخدام `supabase.auth.updateUser()`

## التحقق من الإعدادات

### Test Forgot Password:
1. اذهب إلى `/auth/forgot-password`
2. أدخل بريد إلكتروني موجود
3. تحقق من بريدك الإلكتروني (قد يكون في Spam)
4. انقر على الرابط في البريد
5. يجب أن تتوجه إلى `/auth/reset-password`
6. أدخل كلمة المرور الجديدة

### إذا لم يعمل:
1. تحقق من أن `NEXT_PUBLIC_APP_URL` صحيح
2. تحقق من أن Redirect URLs تم إضافتها بشكل صحيح في Supabase
3. تحقق من أن Email Template يحتوي على `{{ .ConfirmationURL }}`
4. تحقق من أن البريد الإلكتروني ذهب إلى Spam

## الخطوات السريعة للإعداد

1. **في Supabase Dashboard:**
   - Authentication > URL Configuration
   - أضف الروابط المذكورة أعلاه

2. **في ملف `.env.local`:**
   - أضف متغيرات البيئة المذكورة

3. **تحقق من Email Templates:**
   - Authentication > Email Templates > Reset password
   - تأكد من وجود `{{ .ConfirmationURL }}`

4. **Test:**
   - اذهب إلى `/auth/forgot-password`
   - اختبر العملية كاملة

## ملاحظات أمان مهمة

1. **لا تحفظ الـ Access Token** - يتم استخراجه من URL فقط
2. **تحقق من التوقيع** - Supabase يتحقق من التوقيع تلقائياً
3. **استخدم HTTPS** - تأكد من استخدام HTTPS في الإنتاج
4. **المدة الزمنية** - رابط Reset Password صالح لمدة ساعة واحدة فقط
