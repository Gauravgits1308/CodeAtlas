import * as React from "react"
import Link from "next/link"
import { Heading } from "@/components/common/Heading"

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Heading level="h3" className="text-2xl font-bold">
          Forgot your password?
        </Heading>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Form placeholder shell */}
      <div className="py-6 border-y border-border/20 text-center text-sm text-muted-foreground italic">
        [Forgot Password Form Placeholder Shell]
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Back to{" "}
        <Link href="/sign-in" className="text-primary hover:underline font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  )
}
