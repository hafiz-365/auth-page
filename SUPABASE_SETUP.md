# Supabase Authentication Setup Guide

This guide explains how to set up Supabase with OAuth (Google & GitHub), custom email domains, and subdomain routing for authentication pages.

## Table of Contents

1. [Initial Supabase Setup](#initial-supabase-setup)
2. [OAuth Configuration](#oauth-configuration)
3. [Email Configuration](#email-configuration)
4. [Subdomain Routing Setup](#subdomain-routing-setup)
5. [Deployment on Your Server](#deployment-on-your-server)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Initial Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project details:
   - **Name**: e.g., `my-app-auth`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate tier

### 2. Get Your API Credentials

After project creation, navigate to **Settings → API**:

- **Project URL**: `https://[project-id].supabase.co`
- **Anon Key**: Public key for client-side access
- **Service Role Key**: Secret key for server-side operations

Store these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://auth.example.com
```

---

## OAuth Configuration

### Google OAuth Setup

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Google+ API**:
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to **Credentials** (left sidebar)
   - Click **Create Credentials → OAuth Client ID**
   - Choose **Web Application**
   - Add Authorized redirect URIs:
     ```
     https://[project-id].supabase.co/auth/v1/callback?provider=google
     https://auth.example.com/auth/callback
     ```
   - Copy **Client ID** and **Client Secret**

#### Step 2: Configure in Supabase

1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and enable it
3. Paste your:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

### GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name**: e.g., "My App Auth"
   - **Homepage URL**: `https://auth.example.com`
   - **Authorization callback URL**:
     ```
     https://[project-id].supabase.co/auth/v1/callback?provider=github
     https://auth.example.com/auth/callback
     ```
4. Copy **Client ID** and generate **Client Secret**

#### Step 2: Configure in Supabase

1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **GitHub** and enable it
3. Paste your:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

## Email Configuration

### Using Supabase Built-in Email Service

#### For Development:
1. Go to **Authentication → Email Templates**
2. Review default templates
3. Test with email in debug mode (free tier limitation)

#### For Production:
1. Go to **Authentication → Email Settings**
2. Choose one of these options:

**Option A: Use Supabase SMTP**
- Go to **Settings → Email**
- Enable **Custom SMTP**
- Enter SMTP credentials (from your email provider)

**Option B: Use Third-party Service**
- Configure SendGrid, Resend, or Mailgun
- Update the Email Webhook (see next section)

### Setting Up Email Webhook

If using a custom email service, configure a webhook to send emails:

1. In Supabase, go to **Authentication → Email Templates**
2. Enable **Email Webhook**
3. Set webhook URL to your backend: `https://api.example.com/email/send`

Example webhook handler:

```typescript
// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend' // or your email service

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { email, data } = await request.json()

  try {
    await resend.emails.send({
      from: 'noreply@example.com',
      to: email,
      subject: data.subject || 'Verify your email',
      html: data.confirmation_url
        ? `<a href="${data.confirmation_url}">Confirm email</a>`
        : data.recovery_url
        ? `<a href="${data.recovery_url}">Reset password</a>`
        : '',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
```

---

## Subdomain Routing Setup

### Architecture Overview

```
Main Domain: example.com
Auth Domain: auth.example.com (all authentication pages)
API Domain: api.example.com (backend endpoints)
```

### DNS Configuration

#### Update DNS Records

Add these records to your domain provider (GoDaddy, Cloudflare, etc.):

```
Subdomain: auth
Type: CNAME
Value: your-vercel-deployment.vercel.app

Subdomain: api
Type: CNAME
Value: your-vercel-deployment.vercel.app

Subdomain: www
Type: CNAME
Value: your-vercel-deployment.vercel.app
```

### Configure in Next.js

#### Update Environment Variables

```env
# .env.local
NEXT_PUBLIC_APP_URL=https://auth.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

#### Set Up Routing with Middleware

Create `middleware.ts` in project root:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Route auth.example.com to /auth pages
  if (hostname.startsWith('auth.')) {
    if (!request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.rewrite(new URL('/auth' + request.nextUrl.pathname, request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
```

---

## Deployment on Your Server

### Option 1: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL
   ```
5. Deploy
6. Add custom domains in Vercel project settings

### Option 2: Deploy to Self-hosted Server

#### Prerequisites
- Node.js 18+ installed
- PM2 for process management
- Nginx as reverse proxy

#### Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up environment on server**
   ```bash
   ssh user@your-server.com
   cd /var/www/my-app
   
   # Create .env.production
   cat > .env.production << EOF
   NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=https://auth.example.com
   EOF
   ```

3. **Install dependencies and build**
   ```bash
   npm ci
   npm run build
   ```

4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "auth-app" -- start
   pm2 save
   ```

5. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/auth.example.com
   server {
     listen 80;
     server_name auth.example.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. **Enable SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d auth.example.com
   ```

---

## Testing

### 1. Test Password Reset

1. Navigate to `https://auth.example.com/auth/forgot-password`
2. Enter your email
3. Check email for reset link
4. Click link and reset password

### 2. Test OAuth Providers

1. Navigate to `https://auth.example.com/auth/login`
2. Click "Continue with Google"
3. Authenticate with Google account
4. Verify redirect back to your app

### 3. Test Email Confirmation

1. Create a new account
2. Check email for confirmation link
3. Click link to confirm email

---

## Troubleshooting

### Issue: "Multiple GoTrueClient instances detected"

**Solution**: Ensure Supabase client is created only once per action, not on every render.

```typescript
// ✅ CORRECT: Create client inside handler
const handleClick = () => {
  const supabase = createClient()
  // use supabase
}

// ❌ WRONG: Create client on every render
const supabase = createClient()
```

### Issue: OAuth Redirect Not Working

1. Verify redirect URL in Google/GitHub settings matches exactly:
   - Should include `https://`
   - Exact subdomain match
   - Check for trailing slashes

2. Check Supabase project URL is correct:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   ```

### Issue: Password Reset Email Not Received

1. Check Supabase Email Settings:
   - Go to **Authentication → Email**
   - Verify email service is configured

2. Check Email Webhook:
   - Ensure webhook URL is accessible
   - Check webhook logs in Supabase dashboard

3. Check Email Templates:
   - Go to **Authentication → Email Templates**
   - Verify reset password template is enabled

### Issue: CORS Errors

Add your domain to Supabase CORS settings:

1. Go to **Settings → API**
2. Add your auth domain to allowed origins:
   ```
   https://auth.example.com
   ```

### Issue: Session Expires After OAuth Redirect

Ensure callback route is properly set up:

1. Check `/app/auth/callback/route.ts` exists
2. Verify it handles the OAuth code exchange
3. Check redirect URL environment variable is set correctly

---

## File Structure

```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   └── callback/
│       └── route.ts
├── api/
│   ├── auth/
│   │   ├── forgot-password/
│   │   │   └── route.ts
│   │   ├── reset-password/
│   │   │   └── route.ts
│   │   └── signup/
│   │       └── route.ts
│   └── email/
│       └── send/
│           └── route.ts
lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
```

---

## Next Steps

1. Set up custom email domain for better deliverability
2. Implement 2FA/MFA for enhanced security
3. Add rate limiting on auth endpoints
4. Set up monitoring and alerting
5. Create backup and disaster recovery plan

For more help, visit [Supabase Documentation](https://supabase.com/docs)
