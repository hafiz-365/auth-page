# Supabase Authentication Setup

## تم ربط صفحات التسجيل والدخول بـ Supabase بنجاح!

### الملفات المُنشأة/المُعدَّلة:

#### 1. **عملاء Supabase**
- `lib/supabase/client.ts` - عميل Supabase للعميل (Client-side)
- `lib/supabase/server.ts` - عميل Supabase للخادم (Server-side)

#### 2. **API Routes**
- `app/api/auth/signup/route.ts` - API endpoint للتسجيل الجديد
- `app/api/auth/login/route.ts` - API endpoint للدخول

#### 3. **Middleware**
- `middleware.ts` - معالج الوسيط الأساسي
- `lib/supabase/middleware.ts` - تحديث جلسة المستخدم

#### 4. **Hooks**
- `lib/hooks/use-auth.ts` - Hook مخصص للحصول على معلومات المستخدم الحالي

#### 5. **صفحات محدثة**
- `app/auth/signup/page.tsx` - تم تحديثها لاستدعاء API التسجيل
- `app/auth/login/page.tsx` - تم تحديثها لاستدعاء API الدخول

---

## كيفية الاستخدام

### 1. استخدام Auth Hook للحصول على معلومات المستخدم
```tsx
import { useAuth } from '@/lib/hooks/use-auth'

export default function MyComponent() {
  const { user, loading, error } = useAuth()
  
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  
  return <p>Welcome, {user?.email}!</p>
}
```

### 2. الدخول إلى عميل Supabase من جانب العميل
```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('customers').select('*')
```

### 3. الدخول إلى عميل Supabase من جانب الخادم
```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('customers').select('*').single()
```

---

## ميزات الأمان المُدمجة

✅ **تشفير كلمات المرور**: يتم التعامل معه بواسطة Supabase  
✅ **التحقق من صحة البيانات**: على كل من العميل والخادم  
✅ **معالجة الأخطاء**: رسائل خطأ آمنة وواضحة  
✅ **إدارة الجلسات**: يتم التعامل معها تلقائياً بواسطة Supabase SSR  

---

## خطوات التشغيل

1. **تأكد من أن متغيرات البيئة قد تم تعيينها:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **تشغيل التطبيق:**
   ```bash
   npm run dev
   ```

3. **اختبر المسارات:**
   - التسجيل: `http://localhost:3000/auth/signup`
   - الدخول: `http://localhost:3000/auth/login`

---

## جدول Customers

تأكد من أن جدول `customers` يحتوي على الأعمدة التالية:

```sql
- id (UUID) - Primary Key
- first_name (VARCHAR)
- last_name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- created_at (TIMESTAMP)
```

---

## الملاحظات الإضافية

- يتم حفظ بيانات المستخدم تلقائياً في جدول `customers` عند التسجيل
- يتم تسجيل دخول المستخدم تلقائياً بعد التسجيل الناجح
- يمكنك تخصيص معالجة الأخطاء حسب الحاجة في ملفات API

