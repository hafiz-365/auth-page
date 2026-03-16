import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("[v0] OAuth callback received:", { hasCode: !!code, hasError: !!error })

  // Check for errors from OAuth provider
  if (error) {
    console.error("[v0] OAuth error:", { error, errorDescription })
    const errorUrl = new URL("/auth/login", request.nextUrl.origin)
    errorUrl.searchParams.set("error", error)
    if (errorDescription) {
      errorUrl.searchParams.set("error_description", errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  // Exchange the code for a session
  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log("[v0] Exchanging OAuth code for session")

      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error("[v0] Session exchange error:", sessionError)
        const errorUrl = new URL("/auth/login", request.nextUrl.origin)
        errorUrl.searchParams.set("error", "session_exchange_failed")
        return NextResponse.redirect(errorUrl)
      }

      if (data.session) {
        console.log("[v0] Session established, redirecting to home")
        
        // Create response and set the session cookie
        const response = NextResponse.redirect(new URL("/", request.nextUrl.origin))

        // Set the session cookie
        response.cookies.set({
          name: "sb-auth-token",
          value: data.session.access_token,
          maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })

        return response
      }
    } catch (error) {
      console.error("[v0] OAuth callback error:", error)
      const errorUrl = new URL("/auth/login", request.nextUrl.origin)
      errorUrl.searchParams.set("error", "callback_error")
      return NextResponse.redirect(errorUrl)
    }
  }

  // If no code and no error, redirect to login
  console.warn("[v0] OAuth callback: No code or error provided")
  return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin))
}
