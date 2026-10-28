import { SiteNav } from "@/components/site/site-nav"
import { Hero } from "@/components/site/hero"
import { Showcase } from "@/components/site/showcase"
import { Pricing } from "@/components/site/pricing"
import { Faq } from "@/components/site/faq"
import { Cta } from "@/components/site/cta"
import { SiteFooter } from "@/components/site/site-footer"
import { FooterBackground } from "@/components/site/footer-background"

/** Marketing homepage (ported from the Framer site). Always light, whatever the app theme. */
export default function Home() {
  return (
    <div data-theme="light" className="flex min-h-svh flex-1 flex-col items-center bg-canvas text-fg-primary">
      <SiteNav />
      <main className="flex w-full flex-col items-center">
        <Hero />
        <Showcase />
        <Pricing />
        <Faq />
      </main>
      {/* closing call-to-action + footer share the Figma footer background */}
      <div className="relative isolate flex w-full flex-col items-center">
        <FooterBackground />
        <Cta />
        <SiteFooter />
      </div>
    </div>
  )
}
