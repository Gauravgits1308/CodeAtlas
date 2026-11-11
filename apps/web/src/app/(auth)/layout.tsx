"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignUp = pathname?.includes("sign-up");

  // Pure, deterministic pseudo-random number generator to satisfy React 19 purity
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Pre-generate 18 static particles outside the center card zone with opacity twinkle only (no floating movement)
  const particles = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const r1 = pseudoRandom(i * 12.3);
      const r2 = pseudoRandom(i * 34.5);
      const r3 = pseudoRandom(i * 56.7);
      const r4 = pseudoRandom(i * 78.9);

      const isLeft = r1 < 0.5;
      const left = isLeft ? r2 * 32 : 68 + r2 * 32;

      const isTop = r3 < 0.5;
      const top = isTop ? r4 * 28 : 72 + r4 * 28;

      const size = 2 + r4 * 2.5;
      const delay = `${(r2 * 8).toFixed(1)}s`;
      const duration = `${(6 + r3 * 6).toFixed(1)}s`;

      return {
        left: `${left.toFixed(1)}%`,
        top: `${top.toFixed(1)}%`,
        size: `${size.toFixed(1)}px`,
        delay,
        duration,
      };
    });
  }, []);

  const headingText = isSignUp ? "Create your Revora workspace" : "Welcome to Revora";
  const subtitleText = isSignUp
    ? "Continue with GitHub to start indexing your code."
    : "Continue with GitHub to access your workspace.";

  return (
    <div className="min-h-screen h-screen bg-[#070A13] text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">

      {/* Static blueprint grid matching the landing page parameters */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E2638_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.12] pointer-events-none" />

      {/* SINGLE subtle pulsing radial glow behind the card (25s loop, GPU accelerated scale/opacity only) */}
      <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-blue-500/[0.04] rounded-full blur-[130px] pointer-events-none animate-subtle-glow" />

      {/* Static background particles with slow opacity twinkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-blue-400/25 animate-particle-twinkle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Soft Vignette Edge Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(7,10,19,0.9)_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex flex-col items-center justify-center relative z-10 space-y-6 max-w-xl">

        {/* Logo Section */}
        <div className="flex items-center gap-2.5 select-none pt-2 animate-fade-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6 opacity-90" fill="none">
            <defs>
              <linearGradient id="auth-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="8" fill="#0A0F1D" stroke="url(#auth-logo-grad)" strokeWidth="1.5"/>
            <path d="M10 11L6 16L10 21" stroke="url(#auth-logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 11L26 16L22 21" stroke="url(#auth-logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="3" fill="#F9FAFB"/>
            <path d="M16 8V11" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 21V24" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-[22px] tracking-tight text-white font-sans">
            Revora
          </span>
        </div>

        {/* Heading Section */}
        <div className="flex flex-col items-center text-center space-y-1 select-none w-full px-4 animate-fade-heading">
          <h1 className="text-[28px] sm:text-[34px] md:text-[38px] leading-tight font-bold tracking-tight text-white select-none">
            {headingText}
          </h1>
          <div className="animate-fade-subtitle mt-0.5">
            <p className="text-[17px] text-muted-foreground/60 leading-normal max-w-[420px]">
              {subtitleText}
            </p>
          </div>
        </div>

        {/* Auth Component Container */}
        <div className="w-full flex justify-center pt-0">
          {children}
        </div>

      </div>
    </div>
  );
}
