import { Hero } from "@/features/landing/components/Hero"
import { Features } from "@/features/landing/components/Features"
import { ProductPreview } from "@/features/landing/components/ProductPreview"
import { WhyCodeAtlas } from "@/features/landing/components/WhyCodeAtlas"
import { About } from "@/features/landing/components/About"
import { Documentation } from "@/features/landing/components/Documentation"
import { Roadmap } from "@/features/landing/components/Roadmap"
import { FAQ } from "@/features/landing/components/FAQ"
import { Contact } from "@/features/landing/components/Contact"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen scroll-smooth">
      <div id="home">
        <Hero />
      </div>
      <Features />
      <ProductPreview />
      <WhyCodeAtlas />
      <About />
      <Documentation />
      <Roadmap />
      <FAQ />
      <Contact />
    </div>
  )
}
