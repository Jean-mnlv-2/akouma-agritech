import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AdSpace from "@/components/AdSpace";
import TitleManager from "@/components/TitleManager";
import NewsSection from "@/components/NewsSection";
import SeedsSection from "@/components/SeedsSection";
import ShopSection from "@/components/ShopSection";
import StatsSection from "@/components/StatsSection";
import { useI18n } from "@/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-agritech.jpg";
import heroImageAvif from "@/assets/hero-agritech.jpg?format=avif&quality=70";

const Index = () => {
  const { t } = useI18n();
  const statsRef = useScrollReveal({ threshold: 0.2 });
  const servicesRef = useScrollReveal({ threshold: 0.15 });
  const newsRef = useScrollReveal({ threshold: 0.1 });
  const seedsRef = useScrollReveal({ threshold: 0.1 });
  const shopRef = useScrollReveal({ threshold: 0.1 });
  const adRef = useScrollReveal({ threshold: 0.2 });
  const aboutRef = useScrollReveal({ threshold: 0.15 });
  const contactRef = useScrollReveal({ threshold: 0.15 });

  return (
    <div className="min-h-screen">
      {/* LCP preload — image hero (haute priorité, fetchpriority=high) */}
      <Helmet>
        <link
          rel="preload"
          as="image"
          href={heroImageAvif}
          type="image/avif"
          // @ts-expect-error - fetchpriority is a valid HTML attribute
          fetchpriority="high"
        />
      </Helmet>
      <TitleManager
        title="KILIMO Agritech - Agriculture Intelligente & Formations"
        description="Révolutionnez votre agriculture avec KILIMO! Formation en ligne, semences certifiées, outils agricoles et accompagnement expert pour les agriculteurs africains."
        canonical={window.location.origin + '/'}
        image="/kilimo-logo.png"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "KILIMO Agritech",
          "url": window.location.origin,
          "logo": `${window.location.origin}/kilimo-logo.png`,
          "sameAs": [
            "https://twitter.com/kilimoagritech",
            "https://facebook.com/kilimoagritech",
            "https://linkedin.com/company/kilimoagritech"
          ],
          "description": "KILIMO Agritech est une plateforme dédiée à l'avancement de l'agriculture par la technologie, l'éducation et les semences de qualité pour les agriculteurs africains.",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "CM"
          }
        }}
      />
      <Header />
      <main>
        {/* Hero Section - Full viewport */}
        <section id="hero" className="relative">
          <Hero />
        </section>
        
        {/* Statistics Section */}
        <section 
          id="stats" 
          ref={statsRef.elementRef}
          className={`transition-all duration-1000 ${
            statsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <StatsSection />
        </section>
        
        {/* Services Section */}
        <section 
          id="services"
          ref={servicesRef.elementRef}
          className={`transition-all duration-1000 ${
            servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Services />
        </section>
        
        {/* News Section */}
        <section 
          id="news"
          ref={newsRef.elementRef}
          className={`transition-all duration-1000 ${
            newsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <NewsSection />
        </section>
        
        {/* Seeds Section */}
        <section 
          id="seeds"
          ref={seedsRef.elementRef}
          className={`transition-all duration-1000 ${
            seedsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <SeedsSection />
        </section>
        
        {/* Shop Section */}
        <section 
          id="shop"
          ref={shopRef.elementRef}
          className={`transition-all duration-1000 ${
            shopRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <ShopSection />
        </section>
        
        {/* Strategic Ad Placement */}
        <section 
          ref={adRef.elementRef}
          className={`py-12 bg-gradient-to-br from-muted/40 via-muted/20 to-background transition-all duration-1000 ${
            adRef.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="container mx-auto px-6">
            <AdSpace 
              size="banner" 
              title={t("ad.title")}
              description={t("ad.desc")}
              buttonText={t("ad.button")}
            />
          </div>
        </section>
        
        {/* About Section */}
        <section 
          id="about"
          ref={aboutRef.elementRef}
          className={`transition-all duration-1000 ${
            aboutRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <About />
        </section>
        
        {/* Contact Section */}
        <section 
          id="contact"
          ref={contactRef.elementRef}
          className={`transition-all duration-1000 ${
            contactRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Contact />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
