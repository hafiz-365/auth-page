import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone } = body

    // Validate input
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          phone,
        },
      },
    })

    if (authError) {
      // Check for specific error messages
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Insert user data into customers table
    const { error: insertError } = await supabase
      .from('customers')
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          created_at: new Date().toISOString(),
        },
      ])

    if (insertError) {
      // If insert fails, we should ideally delete the auth user
      // but for now we'll just return an error
      console.error('Error inserting customer data:', insertError)
      return NextResponse.json(
        { error: 'Failed to create customer record' },
        { status: 400 }
      )
    }

    // Sign in the user after successful signup
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Signup successful but auto-login failed. Please login manually.' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Signup successful',
        user: authData.user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
