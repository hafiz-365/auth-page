# دليل البدء السريع - Forgot Password

## 1. إعدادات Supabase (5 دقائق)

### خطوة 1: أضف Redirect URLs
1. اذهب إلى لوحة تحكم Supabase
2. **Authentication > URL Configuration**
3. أضف هذه الروابط تحت "Redirect URLs":
   ```
   http://localhost:3000/auth/login
   http://localhost:3000/auth/reset-password
   ```

### خطوة 2: تحقق من Email Template
1. اذهب إلى **Authentication > Email Templates**
2. اختر **Reset password**
3. تأكد من وجود هذا الرابط:
   ```
   {{ .ConfirmationURL }}
   ```

### خطوة 3: تحقق من متغيرات البيئة
```env
# ملف .env.local يجب أن يحتوي على:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_JWT_SECRET=your_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. اختبر التطبيق (3 دقائق)

### اختبار:
1. افتح `http://localhost:3000/auth/login`
2. انقر على "Forgot password?"
3. أدخل بريد إلكتروني موجود
4. تحقق من البريد الإلكتروني (قد يأخذ 30 ثانية)
5. انقر على الرابط في البريل
6. أدخل كلمة مرور جديدة
7. أدخل التأكيد
8. انقر "Reset password"
9. يجب أن ترى رسالة نجاح ✓

## 3. الملفات المهمة

| الملف | الوصف |
|------|-------|
| `/app/api/auth/forgot-password/route.ts` | API لطلب إعادة تعيين |
| `/app/api/auth/reset-password/route.ts` | API لتحديث كلمة المرور |
| `/app/auth/forgot-password/page.tsx` | صفحة طلب إعادة التعيين |
| `/app/auth/reset-password/page.tsx` | صفحة تحديث كلمة المرور |

## 4. إذا حدثت مشكلة

### لم أستقبل بريد إلكتروني؟
- [ ] تحقق من مجلد Spam
- [ ] تأكد من أن `NEXT_PUBLIC_APP_URL` صحيح
- [ ] تأكد من Redirect URLs

### الرابط في البريد لا يعمل؟
- [ ] تأكد من أن Email Template يحتوي على `{{ .ConfirmationURL }}`
- [ ] تحقق من أن البريد حديث وليس منتهي الصلاحية

### صفحة Reset Password تظهر خطأ؟
- [ ] تأكد من الرابط يبدأ بـ `?type=recovery&access_token=`
- [ ] جرب الرابط مباشرة من البريل مرة أخرى

## ملخص الخطوات

```
1. أضف Redirect URLs في Supabase
2. تحقق من Email Template
3. تحقق من متغيرات البيئة
4. اختبر العملية كاملة
```

## معلومات إضافية

- قراءة `SUPABASE_CONFIG_GUIDE.md` للتفاصيل الكاملة
- قراءة `FORGOT_PASSWORD_IMPLEMENTATION.md` لفهم البنية
