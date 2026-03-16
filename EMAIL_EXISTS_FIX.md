# Email Already Registered Error - Fixed

## Problem
The API was receiving `email_exists` error when a user tried to sign up with an email that already exists in Supabase Auth. The error handling wasn't properly catching this specific error code.

## Root Cause
- The error check was looking for text "already registered" in the error message
- Supabase actually returns an error with `code: 'email_exists'` 
- When the error wasn't caught properly, it was throwing an uncaught exception

## Solution

### 1. API Route (`app/api/auth/signup/route.ts`)
Updated error handling to check for the specific error code:

```typescript
if (authError) {
  console.error('Auth error:', authError)
  // Check for specific error codes/messages
  if (authError.code === 'email_exists' || authError.message?.includes('already registered')) {
    return NextResponse.json(
      { error: 'This email is already registered. Please use a different email or try logging in.' },
      { status: 409 }
    )
  }
  return NextResponse.json(
    { error: authError.message || 'Failed to create user account' },
    { status: 400 }
  )
}
```

Also improved catch block to handle auth errors:

```typescript
catch (error: any) {
  if (error?.__isAuthError) {
    if (error.code === 'email_exists') {
      return NextResponse.json(
        { error: 'This email is already registered. Please use a different email or try logging in.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 400 }
    )
  }
  // ... handle other errors
}
```

### 2. Signup Page (`app/auth/signup/page.tsx`)
Enhanced error display to show a login link when email is already registered:

```typescript
{errors.form.includes("already registered") && (
  <p className="text-sm text-destructive/90 mt-2">
    <Link href="/auth/login" className="underline underline-offset-2 hover:text-destructive">
      Go to login page
    </Link>
  </p>
)}
```

## Testing
Now when users try to sign up with an existing email:
1. ✅ API catches the `email_exists` error code
2. ✅ Returns proper 409 status with friendly message
3. ✅ UI displays error with link to login page
4. ✅ User experience is improved with helpful guidance

## Error Codes from Supabase Auth
- `email_exists` - Email already registered
- `validation_failed` - Invalid input
- `over_request_limit` - Too many requests
- `invalid_grant` - Invalid credentials

Reference these codes for specific error handling.
