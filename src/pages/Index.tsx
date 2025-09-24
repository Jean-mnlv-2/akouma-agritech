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

const Index = () => {
  const { t } = useI18n();

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
        <section id="hero">
          <Hero />
        </section>
        
        {/* Statistics Section */}
        <section id="stats">
          <StatsSection />
        </section>
        
        <section id="services">
          <Services />
        </section>
        
        {/* News Section with Horizontal Scroll */}
        <section id="news">
          <NewsSection />
        </section>
        
        {/* Seeds Section with Horizontal Scroll */}
        <section id="seeds">
          <SeedsSection />
        </section>
        
        {/* Shop Section with Horizontal Scroll */}
        <section id="shop">
          <ShopSection />
        </section>
        
        {/* Strategic Ad Placement */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-6">
            <AdSpace 
              size="banner" 
              title={t("ad.title")}
              description={t("ad.desc")}
              buttonText={t("ad.button")}
            />
          </div>
        </section>
        
        <section id="about">
          <About />
        </section>
        <section id="contact">
          <Contact />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
