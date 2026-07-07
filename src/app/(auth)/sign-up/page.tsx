import * as React from "react"
import Link from "next/link"
import { Heading } from "@/components/common/Heading"

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Heading level="h3" className="text-2xl font-bold">
          Create your account
        </Heading>
        <p className="text-sm text-muted-foreground">
          Sign up now to begin scanning your repositories
        </p>
      </div>

      {/* Form placeholder shell */}
      <div className="py-6 border-y border-border/20 text-center text-sm text-muted-foreground italic">
        [SignUp Form Placeholder Shell]
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  )
}
