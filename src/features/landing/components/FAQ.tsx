"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { FAQS } from "@/constants/landingData"

export function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <Section className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Frequently Asked <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Questions</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-normal">
            Everything you need to know about the platform. Find answers regarding indexing details, security standards, and support.
          </p>
        </div>

        {/* Accordion Layout */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="border border-border/40 bg-card/25 rounded-xl overflow-hidden transition-colors hover:bg-card/40"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 text-left text-foreground font-semibold text-sm sm:text-base hover:text-primary transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <span className="shrink-0 ml-4 p-1 rounded-md bg-muted text-muted-foreground">
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/10">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
