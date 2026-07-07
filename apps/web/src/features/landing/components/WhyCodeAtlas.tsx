"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Shield, Zap, Target, GitBranch } from "lucide-react"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"

export function WhyCodeAtlas() {
  const reasons = [
    {
      icon: Zap,
      title: "Real-time Indexing",
      desc: "Instant AST parsing on every push. Your semantic map remains synchronized with your latest commit without lag."
    },
    {
      icon: Shield,
      title: "Zero-Trust Privacy",
      desc: "Your source code is never used to train public LLMs. We leverage isolated models and secure, encrypted storage."
    },
    {
      icon: Target,
      title: "Syntax-Aware Context",
      desc: "No simple chunking. CodeAtlas understands imports, exports, class boundaries, and functions, generating hyper-accurate answers."
    },
    {
      icon: GitBranch,
      title: "Native Git Workflows",
      desc: "Seamless integration with GitHub, GitLab, and Bitbucket. Import any repository in under three clicks."
    }
  ]

  return (
    <Section className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Designed for <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Enterprise Engineering</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Traditional tools struggle with complex refactoring and large files. CodeAtlas is built to scale to millions of lines of code.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {reasons.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -15 : 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 hover:bg-muted/10 rounded-xl transition-all border border-transparent hover:border-border/40"
              >
                <div className="p-3 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 shrink-0">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
