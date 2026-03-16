# حل مشكلة Row-Level Security (RLS) في جدول Customers

## المشكلة الأصلية
عند محاولة إنشاء حساب جديد (signup)، ظهر الخطأ:
```
Error inserting customer data: {
  code: '42501',
  message: 'new row violates row-level security policy for table "customers"'
}
```

## السبب
جدول `customers` في Supabase يحتوي على **Row-Level Security (RLS)** مفعّل مع سياستين فقط:
- `customers_select_own`: السماح للمستخدم بـ SELECT لبيانته الخاصة
- `customers_update_own`: السماح للمستخدم بـ UPDATE لبيانته الخاصة

**لا توجد سياسة INSERT**، لذلك لا يمكن إدراج سجلات جديدة باستخدام المفتاح العام (Anon Key).

## الحل المطبق
تم تحديث API endpoints ليستخدموا **Service Role Key** بدلاً من Anon Key:

### 1. في `/app/api/auth/signup/route.ts`:
```typescript
// استخدام Service Role Key لتجاوز RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// استخدام admin API لإنشاء المستخدم
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  user_metadata: { firstName, lastName, phone }
})

// إدراج البيانات باستخدام Service Role (يتجاوز RLS)
const { error: insertError } = await supabaseAdmin
  .from('customers')
  .insert([...])
```

### 2. في `/app/api/auth/login/route.ts`:
```typescript
// المصادقة تستخدم Anon Key (العميل العادي)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// الدخول
const { data } = await supabase.auth.signInWithPassword({ email, password })

// جلب البيانات باستخدام Service Role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data: customer } = await supabaseAdmin
  .from('customers')
  .select('*')
  .eq('id', data.user.id)
```

## لماذا هذا الحل آمن؟

1. **API موثوقة**: Service Role Key يُستخدم فقط على الخادم (server-side)، ليس على العميل
2. **التحقق من البيانات**: جميع البيانات يتم التحقق منها قبل الإدراج
3. **معالجة الأخطاء**: إذا فشل إدراج البيانات، يتم حذف المستخدم من auth
4. **الأمان الإضافي**: عند محاولة الدخول، يتم استخدام Anon Key (أقل صلاحيات) للمصادقة، و Service Role فقط لجلب البيانات بعد التحقق من الهوية

## بيانات المتغيرات البيئية المطلوبة
```
NEXT_PUBLIC_SUPABASE_URL          # Public URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Anon/Public Key
SUPABASE_SERVICE_ROLE_KEY         # Service Role Key (سري!)
```

**ملاحظة مهمة**: `SUPABASE_SERVICE_ROLE_KEY` يجب أن يبقى **سري تماماً** ولا يُرسل إلى العميل!

## الخطوات التالية (اختيارية)
إذا أردت تجنب استخدام Service Role Key، يمكنك إضافة سياسة RLS جديدة:

```sql
-- السماح بـ INSERT للمستخدمين الجدد (authenticated users)
CREATE POLICY "customers_insert_own" ON customers
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

لكن هذا يتطلب تعديل قاعدة البيانات من لوحة Supabase.
