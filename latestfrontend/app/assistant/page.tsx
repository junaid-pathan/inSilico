import { SiteNav } from "@/components/site-nav"
import { LandingFooter } from "@/components/landing/footer"
import { WhobeeHero } from "../../components/assistant/whobee-hero"

export default function AssistantPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <SiteNav />
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-28 lg:px-8">
        <WhobeeHero />
      </div>
      <LandingFooter />
    </main>
  )
}
