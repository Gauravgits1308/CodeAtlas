import * as React from "react"
import Link from "next/link"
import { Github, Mail, Linkedin } from "lucide-react"
import { Logo } from "./Logo"
import { Container } from "@/components/common/Container"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="footer" className="border-t border-border/10 bg-[#070A13] select-none">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 text-left">
          {/* Logo & Tagline */}
          <div className="space-y-4 md:col-span-2">
            <Logo />
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">
              Revora is an AI-powered engineering intelligence platform that transforms software repositories into searchable knowledge.
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/60">
              Made for modern software engineering.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="size-4.5" />
              </a>
              <a
                href="https://www.linkedin.com/in/gaurav-gupta-48258a323/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-4.5" />
              </a>
              <a
                href="mailto:support@revora.ai"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="size-4.5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase font-mono">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase font-mono">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <Link href="#home" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase font-mono">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:support@revora.ai" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="#home" className="text-muted-foreground hover:text-foreground transition-colors">
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-sans">
            &copy; {currentYear} Revora. All rights reserved.
          </p>
          <div className="text-left sm:text-right space-y-0.5 font-mono text-[9px] text-muted-foreground/50">
            <div>Designed & Developed by <span className="text-foreground font-semibold">Gaurav Gupta</span></div>
            <div>Computer Science Student • IIIT Kota</div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
