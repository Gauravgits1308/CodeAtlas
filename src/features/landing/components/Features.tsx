"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { Card } from "@/components/common/Card"
import { FEATURES } from "@/constants/landingData"

export function Features() {
  return (
    <Section id="features" className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Supercharge Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Code Comprehension</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Everything you need to navigate, analyze, document, and review modern software repositories, all in a unified developer experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  hoverEffect={true}
                  glowColor={index % 2 === 0 ? "blue" : "purple"}
                  className="h-full flex flex-col items-start gap-4 p-6 select-none bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-all"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
