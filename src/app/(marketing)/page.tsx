import { Hero } from "@/features/landing/components/Hero"
import { Features } from "@/features/landing/components/Features"
import { ProductPreview } from "@/features/landing/components/ProductPreview"
import { WhyCodeAtlas } from "@/features/landing/components/WhyCodeAtlas"
import { Roadmap } from "@/features/landing/components/Roadmap"
import { FAQ } from "@/features/landing/components/FAQ"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <ProductPreview />
      <WhyCodeAtlas />
      <Roadmap />
      <FAQ />
    </div>
  )
}
