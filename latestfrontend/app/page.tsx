import { SiteNav } from "@/components/site-nav"
import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingFooter } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <SiteNav />
      <LandingHero />
      <LandingFeatures />
      <LandingFooter />
    </main>
  )
}
