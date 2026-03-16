import { Suspense } from "react"
import { ResetPasswordForm } from "./reset-password-form"

function ResetPasswordSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

/*
 * This page is intentionally simple because useSearchParams() is called
 * in ResetPasswordForm component which is wrapped in a Suspense boundary.
 * This pattern is required in Next.js 16 to avoid hydration issues during prerendering.
 */
