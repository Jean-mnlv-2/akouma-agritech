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
import { useI18n } from "@/i18n/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

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
      <TitleManager
        title={t("index.title")}
        description={t("index.description")}
        canonical={window.location.origin + '/'}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      <main className="mobile-page-content">
        {/* Hero Section - Full viewport */}
        <section id="hero" className="relative">
          <Hero />
        </section>
        
        {/* Statistics Section - Animated on scroll */}
        <section 
          id="stats" 
          ref={statsRef.elementRef}
          className={`transition-all duration-1000 ${
            statsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <StatsSection />
        </section>
        
        {/* Services Section - Animated on scroll */}
        <section 
          id="services"
          ref={servicesRef.elementRef}
          className={`transition-all duration-1000 ${
            servicesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Services />
        </section>
        
        {/* News Section - Animated on scroll */}
        <section 
          id="news"
          ref={newsRef.elementRef}
          className={`transition-all duration-1000 ${
            newsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <NewsSection />
        </section>
        
        {/* Seeds Section - Animated on scroll */}
        <section 
          id="seeds"
          ref={seedsRef.elementRef}
          className={`transition-all duration-1000 ${
            seedsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <SeedsSection />
        </section>
        
        {/* Shop Section - Animated on scroll */}
        <section 
          id="shop"
          ref={shopRef.elementRef}
          className={`transition-all duration-1000 ${
            shopRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <ShopSection />
        </section>
        
        {/* Strategic Ad Placement - Animated on scroll */}
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
        
        {/* About Section - Animated on scroll */}
        <section 
          id="about"
          ref={aboutRef.elementRef}
          className={`transition-all duration-1000 ${
            aboutRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <About />
        </section>
        
        {/* Contact Section - Animated on scroll */}
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
