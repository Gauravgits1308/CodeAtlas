"use client";

import { useClerk } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as React from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut } = useClerk();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const errorParam = searchParams.get("error") || searchParams.get("clerk_error");

  React.useEffect(() => {
    // Register beforeunload event listener to log when browser navigation actually starts
    const handleBeforeUnload = () => {
      console.log("[Profiling] Browser navigation/page unload starts. Current time:", performance.now());
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleSwitchAccount = async () => {
    await signOut();
    router.push("/sign-up");
  };

  const handleGitHubSignup = async () => {
    const clickTime = performance.now();
    console.log("[Profiling] Button click registered at:", clickTime);

    if (!signUpLoaded || !signUp) {
      console.warn("Clerk signup is not loaded yet.");
      return;
    }

    // Set redirecting state to disable visual transitions instantly
    console.log("[Profiling] Loading state enabled");
    setIsRedirecting(true);

    try {
      const invokeTime = performance.now();
      console.log(`[Profiling] Delay from click to Clerk invoke: ${(invokeTime - clickTime).toFixed(2)}ms`);

      console.time("Clerk_authenticateWithRedirect_Signup");
      console.log("[Profiling] authenticateWithRedirect() called");
      const redirectPromise = signUp.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
      console.timeEnd("Clerk_authenticateWithRedirect_Signup");

      await redirectPromise;
      console.log("[Profiling] authenticateWithRedirect() promise resolved");
    } catch (err) {
      console.error("[Profiling] Any exception thrown:", err);
      console.log("[Profiling] Loading state disabled due to error");
      setIsRedirecting(false);
    }
  };

  if (errorParam) {
    return (
      <div className="w-full flex flex-col items-center justify-center select-none font-sans animate-fade-card">
        {/* Static elevated authentication card */}
        <div className="w-full max-w-[500px] bg-[#111827]/90 border border-white/[0.06] p-10 rounded-[20px] shadow-2xl text-center space-y-6 backdrop-blur-sm">
          <div className="flex justify-center">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
              <AlertCircle size={24} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">GitHub Account Already Linked</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              This GitHub profile is already associated with an existing Revora user account.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link href="/sign-in" className="block w-full">
              <Button className="w-full h-10 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Sign In Instead</span>
                <ArrowRight size={14} />
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleSwitchAccount}
              className="w-full h-10 border-border/60 hover:bg-[#1E2538]/60 text-foreground font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Switch GitHub Account</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-sans animate-fade-card">
      {/* Static elevated authentication card */}
      <div className="w-full max-w-[500px] bg-[#111827]/90 border border-white/[0.06] p-10 rounded-[20px] shadow-2xl text-center space-y-7 backdrop-blur-sm">

        {/* Card Header inside the card */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white select-none">Create your account</h2>
        </div>

        {/* Custom Primary Action Button with transitions */}
        <button
          onClick={handleGitHubSignup}
          disabled={isRedirecting}
          className="w-full h-[56px] flex justify-center items-center gap-3 bg-white hover:bg-[#EAEAEA] border-none text-black font-semibold rounded-xl cursor-pointer transition-all duration-[220ms] ease-out hover:-translate-y-[1.5px] hover:shadow-md disabled:hover:bg-white disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed disabled:opacity-85 font-sans text-[17px] px-8 select-none animate-fade-btn"
        >
          {isRedirecting ? (
            <>
              {/* Spinner Icon */}
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Redirecting to GitHub...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current" stroke="none">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span>Continue with GitHub</span>
            </>
          )}
        </button>

        {/* Clerk CAPTCHA widget anchor to resolve custom flow bot protection errors */}
        <div id="clerk-captcha" className="flex justify-center" />

        {/* Bottom Area redirect link INSIDE card */}
        <div className="text-[15px] text-muted-foreground/70 pt-2 border-t border-white/[0.03]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-blue-500 hover:text-blue-400 font-semibold hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Bottom Area outside card */}
      <div className="flex flex-col items-center gap-3 mt-6 select-none text-center animate-fade-subtitle">
        <div className="text-[15px] text-muted-foreground/50">
          New to GitHub?{" "}
          <a
            href="https://github.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 font-semibold hover:underline transition-colors"
          >
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
