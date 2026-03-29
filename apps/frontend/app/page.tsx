import { Navbar } from "./components/landing/navbar";
import { BackgroundGrid } from "./components/landing/background-grid";
import { HeroSection } from "./components/landing/hero";
import { ProductPreview } from "./components/landing/product-preview";
import { LovedByTeamsSection } from "./components/landing/loved-by-teams-section";
import { FeaturesSection } from "./components/landing/features-section";
import { IntegrationsSection } from "./components/landing/integrations-section";
import { TestimonialsStrip } from "./components/landing/testimonials-strip";
import { FaqSection } from "./components/landing/faq-section";
import { Footer } from "./components/landing/footer";

export default function Home() {
  return (
    <BackgroundGrid>
      <Navbar />
      <HeroSection />
      <ProductPreview />
      <LovedByTeamsSection />
      <TestimonialsStrip />
      <FeaturesSection />
      <IntegrationsSection />
      <FaqSection />
      <Footer />
    </BackgroundGrid>
  );
}
