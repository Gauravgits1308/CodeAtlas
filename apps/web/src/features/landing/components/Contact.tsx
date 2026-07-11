"use client"

import * as React from "react"
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { Button } from "@/components/ui/button"

export function Contact() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Frontend validations
    if (!formData.name.trim()) {
      toast.error("Please enter your name.")
      return
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject.")
      return
    }
    if (!formData.message.trim()) {
      toast.error("Please enter your message.")
      return
    }

    setIsSubmitting(true)
    try {
      // Connect to the backend API endpoint
      const response = await api.post<{ success: boolean; message: string }>("/v1/contact", formData)
      toast.success(response.message || "Message sent successfully!")
      
      // Clear form on success
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to submit contact query.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Section id="contact" className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="purpleGlow" className="px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
            Get In Touch
          </Badge>
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Contact Us
          </Heading>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Have questions about CodeAtlas, semantic indexing, or our integrations? Reach out to our engineering support team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start max-w-6xl mx-auto">
          {/* Left Column: Contact Information */}
          <div className="lg:col-span-5 space-y-8 bg-[#111827]/20 border border-border/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold">Contact Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fill out the form on the right or reach our project office directly through any of the channels below.
              </p>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Mail className="size-5" />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</span>
                  <a href="mailto:gaurav.init13@gmail.com" className="text-sm font-semibold hover:text-primary transition-colors">
                    gaurav.init13@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Phone className="size-5" />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider">Phone</span>
                  <a href="tel:+919628135776" className="text-sm font-semibold hover:text-emerald-400 transition-colors">
                    +91 9628135776
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider">Location</span>
                  <span className="text-sm font-semibold text-foreground">
                    Noida, Uttar Pradesh, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <form 
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-[#111827]/30 border border-border/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#111827]/40 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#111827]/40 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                disabled={isSubmitting}
                placeholder="How can we help you?"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-[#111827]/40 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
              <textarea
                id="message"
                name="message"
                required
                disabled={isSubmitting}
                rows={5}
                placeholder="Write your details here..."
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-[#111827]/40 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 flex items-center justify-center gap-2 rounded-xl transition-all select-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting request...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Send Message</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </Container>
    </Section>
  )
}
