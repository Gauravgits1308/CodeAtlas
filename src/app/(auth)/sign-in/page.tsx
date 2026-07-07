"use client"

import * as React from "react"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Heading } from "@/components/common/Heading"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Authentication logic is detached for this sprint
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center select-none">
        <Heading level="h3" className="text-2xl font-bold">
          Welcome back
        </Heading>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
              <Mail className="size-4" />
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#111827] border border-border/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
              Password
            </label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
              <Lock className="size-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#111827] border border-border/60 rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-muted-foreground select-none cursor-pointer">
            <input
              type="checkbox"
              className="size-3.5 rounded border-border/60 bg-[#111827] text-primary focus:ring-primary/50 accent-primary cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-primary hover:underline font-semibold">
            Forgot password?
          </Link>
        </div>

        {/* Continue Button */}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-all pt-0.5 cursor-pointer">
          <span>Continue</span>
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex py-2 items-center select-none">
        <div className="flex-grow border-t border-border/20"></div>
        <span className="flex-shrink mx-4 text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider">or</span>
        <div className="flex-grow border-t border-border/20"></div>
      </div>

      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 border-border hover:bg-muted/40 font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors text-foreground cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Sign in with Google</span>
      </Button>

      {/* Footer redirects */}
      <div className="text-center text-xs text-muted-foreground select-none">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary hover:underline font-semibold">
          Create account
        </Link>
      </div>
    </div>
  )
}
