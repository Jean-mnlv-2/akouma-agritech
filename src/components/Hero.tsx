import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-agritech.jpg";
import { useI18n } from "@/i18n/i18n";
import { useEffect, useState } from "react";

const Hero = () => {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-nature"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      ></div>
      
      {/* Animated floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse animate-float"></div>
      <div className="absolute bottom-32 right-16 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/5 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
      
      {/* Gradient mesh overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge with animation */}
          <div className={`inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 border border-primary/20 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Sprout className="w-4 h-4 animate-pulse" />
          <span>Innovation Agritech {currentYear}</span>
          </div>
          
          {/* Main title with enhanced gradient */}
          <h1 className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`} style={{ animationDelay: '0.1s' }}>
            AKOUMA
          </h1>
          
          <h2 className={`text-2xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-8 leading-relaxed transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`} style={{ animationDelay: '0.2s' }}>
            {t("hero.subtitle")}
          </h2>
          
          {/* Description with fade-in */}
          <p className={`text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`} style={{ animationDelay: '0.3s' }}>
            {t("hero.desc")}
          </p>
          
          {/* CTA Buttons with enhanced animations */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`} style={{ animationDelay: '0.4s' }}>
            <Link to="/about" className="group">
              <Button 
                variant="hero" 
                size="xl" 
                className="group focus-visible:ring-4 focus-visible:ring-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
                aria-label={t("hero.cta.solutions")}
              >
                {t("hero.cta.solutions")}
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link to="/demo" className="group">
              <Button 
                variant="outline" 
                size="xl" 
                className="group bg-background/90 backdrop-blur-md border-2 focus-visible:ring-4 focus-visible:ring-accent/40 transition-all duration-300 hover:scale-105 hover:bg-background hover:shadow-lg"
                aria-label={t("hero.cta.demo")}
              >
                <Play className="mr-2 transition-transform group-hover:scale-110" />
                {t("hero.cta.demo")}
              </Button>
            </Link>
          </div>
          
          {/* Stats with staggered animation */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ animationDelay: '0.6s' }}>
            {[
              { value: "500+", label: t("hero.stat.farmers") },
              { value: "25%", label: t("hero.stat.yield") },
              { value: "30%", label: t("hero.stat.cost") }
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
