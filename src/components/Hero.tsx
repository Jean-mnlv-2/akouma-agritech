import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-agritech.jpg";
import { useI18n } from "@/i18n/i18n";

const Hero = () => {
  const { t } = useI18n();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-nature"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      ></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse"></div>
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge 
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 border border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            Innovation Agritech 2024
          </div>*/}
          
          {/* Main title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight animate-fade-in-up">
            AKOUMA
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-semibold text-foreground mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
            {t("hero.subtitle")}
          </h2>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            {t("hero.desc")}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Link to="/about">
              <Button 
                variant="hero" 
                size="xl" 
                className="group focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105"
                aria-label={t("hero.cta.solutions")}
              >
                {t("hero.cta.solutions")}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link to="/demo">
              <Button 
                variant="outline" 
                size="xl" 
                className="group bg-background/80 backdrop-blur-sm focus-visible:ring-4 focus-visible:ring-accent/40 transition-transform duration-200 hover:scale-105"
                aria-label={t("hero.cta.demo")}
              >
                <Play className="transition-transform group-hover:scale-110" />
                {t("hero.cta.demo")}
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50 animate-fade-in-up animation-delay-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">{t("hero.stat.farmers")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">25%</div>
              <div className="text-muted-foreground">{t("hero.stat.yield")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">30%</div>
              <div className="text-muted-foreground">{t("hero.stat.cost")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;