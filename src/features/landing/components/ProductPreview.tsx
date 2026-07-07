"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { ProductPreviewMockup } from "./ProductPreviewMockup"

export function ProductPreview() {
  return (
    <Section id="documentation" className="border-t border-border/40 bg-[#0B0F19]/50">
      <Container className="space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Interactive <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">Architecture Mapping</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Experience real-time interactive codebase maps. Discover bottlenecks, visualize dependencies, and inspect file references instantly.
          </p>
        </div>

        {/* Mockup Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <ProductPreviewMockup />
        </motion.div>
      </Container>
    </Section>
  )
}
