import { AuthErrorBanner } from "./_components/auth-error-banner";
import { Navbar } from "./_components/navbar";
import { Features, FinalCta, Faq, FreeStart, Hero, HowItWorks, Opportunity } from "./_components/sections";
import { Pricing } from "./_components/pricing";
import { Footer } from "./_components/footer";
import { RevealObserver } from "./_components/reveal-observer";
import { FunnelTracker } from "./_components/funnel-tracker";

export default function Home() {
  return (
    <>
      <Navbar />
      <AuthErrorBanner />
      <main className="flex-1">
        <Hero />
        <Opportunity />
        <HowItWorks />
        <Features />
        <FreeStart />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <RevealObserver />
      <FunnelTracker />
    </>
  );
}
