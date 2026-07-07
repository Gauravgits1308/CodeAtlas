import * as React from "react"
import { Heading } from "@/components/common/Heading"

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Heading level="h3" className="text-2xl font-bold">
          Verify your email
        </Heading>
        <p className="text-sm text-muted-foreground">
          Enter the verification code sent to your email address
        </p>
      </div>

      {/* Form placeholder shell */}
      <div className="py-6 border-y border-border/20 text-center text-sm text-muted-foreground italic">
        [Verify Email Form Placeholder Shell]
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Didn&apos;t receive a code?{" "}
        <button className="text-primary hover:underline font-semibold focus:outline-none">
          Resend code
        </button>
      </div>
    </div>
  )
}
