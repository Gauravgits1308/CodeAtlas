import * as React from "react"
import Link from "next/link"
import { Heading } from "@/components/common/Heading"

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Heading level="h3" className="text-2xl font-bold">
          Sign in to your account
        </Heading>
        <p className="text-sm text-muted-foreground">
          Enter your details below to access your workspace
        </p>
      </div>

      {/* Form placeholder shell */}
      <div className="py-6 border-y border-border/20 text-center text-sm text-muted-foreground italic">
        [SignIn Form Placeholder Shell]
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary hover:underline font-semibold">
          Create account
        </Link>
      </div>
    </div>
  )
}
