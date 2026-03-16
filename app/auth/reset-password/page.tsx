"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  
  const errorSummaryRef = React.useRef<HTMLDivElement>(null)
  const errorList = Object.entries(errors)

  // Check if user has access token from email link
  const accessToken = searchParams.get('access_token')
  const type = searchParams.get('type')

  React.useEffect(() => {
    if (type === 'recovery' && !accessToken) {
      setErrors({ form: 'Invalid or expired reset link. Please request a new password reset.' })
    }
  }, [accessToken, type])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Client-side validation
    const newErrors: Record<string, string> = {}

    if (!password) newErrors.password = "Password is required"
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters"

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      setTimeout(() => {
        errorSummaryRef.current?.focus()
      }, 100)
      return
    }

    try {
      // Call reset password API with access token
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ form: data.error || "Failed to reset password" })
        setIsLoading(false)
        setTimeout(() => {
          errorSummaryRef.current?.focus()
        }, 100)
        return
      }

      // Success - show success state
      setIsSuccess(true)
    } catch (error) {
      console.error("Reset password error:", error)
      setErrors({ form: "An error occurred. Please try again." })
      setIsLoading(false)
      setTimeout(() => {
        errorSummaryRef.current?.focus()
      }, 100)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Password reset successfully</h1>
          <p className="text-muted-foreground">
            Your password has been changed. You can now sign in with your new password.
          </p>
        </div>

        <Button
          onClick={() => router.push("/auth/login")}
          className="w-full h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to sign in
        </Button>
      </div>
    )
  }

  // Check for invalid/expired token
  if (type === 'recovery' && !accessToken) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Invalid reset link</h1>
          <p className="text-muted-foreground">
            The password reset link has expired or is invalid.
          </p>
        </div>

        <Button
          asChild
          className="w-full h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link href="/auth/forgot-password">Request a new reset link</Link>
        </Button>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Reset password</h1>
        <p className="text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errorList.length > 0 && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            aria-labelledby="error-summary-title"
            className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p id="error-summary-title" className="font-medium text-destructive">
                  {errors.form ? errors.form : "Please fix the following errors:"}
                </p>
                {!errors.form && (
                  <ul className="text-sm text-destructive/90 space-y-1">
                    {errorList.map(([field, message]) => (
                      <li key={field}>
                        <a 
                          href={`#${field}`}
                          className="underline underline-offset-2 hover:text-destructive"
                        >
                          {message}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Enter new password"
            className="h-12 bg-input border-border transition-all duration-200 focus:scale-[1.01]"
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPassword={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="sr-only">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm new password"
            className="h-12 bg-input border-border transition-all duration-200 focus:scale-[1.01]"
            disabled={isLoading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPassword={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="sr-only">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? "Resetting password..." : "Reset password"}
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  )
}
