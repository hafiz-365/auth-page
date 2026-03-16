import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate input
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create a Supabase admin client for password reset
    // Using service role key to bypass any webhook/auth hook issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Request password reset with a timeout to prevent hanging
    const resetPromise = supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      },
    })

    // Set a timeout of 10 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Password reset request timeout')), 10000)
    )

    const { data, error } = await Promise.race([resetPromise, timeoutPromise]) as any

    if (error) {
      console.error('Password reset error:', error)
    }

    // Always return success for security (user won't know if email exists)
    return NextResponse.json(
      {
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
        email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    // Return success even on error (security best practice - don't reveal if email exists)
    return NextResponse.json(
      {
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
      },
      { status: 200 }
    )
  }
}
