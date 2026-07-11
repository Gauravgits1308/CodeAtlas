"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Show, UserButton, useAuth } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { Logo } from "./Logo"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/common/Container"
import { Badge } from "@/components/common/Badge"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const pathname = usePathname()
  const { userId } = useAuth()
  const isAuthenticated = !!userId

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "#", badge: "Soon" },
    ...(isAuthenticated ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  ]

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5",
                  pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground",
                  link.badge && "pointer-events-none"
                )}
              >
                {link.name}
                {link.badge && (
                  <Badge variant="purpleGlow" className="px-1.5 py-0 text-[10px] font-medium leading-none">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground hover:text-foreground cursor-pointer"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-primary hover:bg-primary/95 text-white shadow-sm font-medium flex items-center gap-1 group cursor-pointer"
                )}
              >
                Get Started
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-base font-medium transition-colors py-1.5 flex items-center gap-2",
                      pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                      link.badge && "pointer-events-none opacity-60"
                    )}
                  >
                    {link.name}
                    {link.badge && (
                      <Badge variant="purpleGlow" className="px-1.5 py-0 text-[10px]">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full text-muted-foreground hover:text-foreground flex items-center justify-center h-10"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center h-10"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center justify-between px-2 py-1.5 border border-border/40 rounded-lg bg-card/20">
                    <span className="text-xs font-semibold text-muted-foreground">My Profile</span>
                    <UserButton />
                  </div>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
