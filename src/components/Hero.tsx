import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sprout, BookOpen, ShoppingBag, Leaf } from "lucide-react";
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
      {/* Background image with parallax effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Animated floating elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium mb-8 border border-white/20 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Sprout className="w-4 h-4 text-green-400 animate-pulse" />
            <span>Innovation Agritech {currentYear}</span>
          </div>
          
          {/* Main title */}
          <h1 className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-4 text-white leading-none tracking-tight transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            AKO<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">UMA</span>
          </h1>
          
          <h2 className={`text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white/90 mb-6 leading-relaxed transition-all duration-1000 delay-100 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {t("hero.subtitle")}
          </h2>
          
          <p className={`text-base sm:text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {t("hero.desc")}
          </p>
          
          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-1000 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <Link to="/about">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-xl hover:scale-105 transition-all">
                {t("hero.cta.solutions")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-xl hover:scale-105 transition-all">
                <Play className="mr-2 w-5 h-5" />
                {t("hero.cta.demo")}
              </Button>
            </Link>
          </div>
          
          {/* Quick navigation cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {[
              { icon: BookOpen, label: "E-Learning", desc: "150+ cours", href: "/elearning", color: "from-blue-500/20 to-cyan-500/20 border-blue-400/30" },
              { icon: Leaf, label: "Semences", desc: "Qualité certifiée", href: "/seeds", color: "from-green-500/20 to-emerald-500/20 border-green-400/30" },
              { icon: ShoppingBag, label: "Boutique", desc: "Équipements pro", href: "/shop", color: "from-orange-500/20 to-amber-500/20 border-orange-400/30" },
            ].map((item) => (
              <Link key={item.href} to={item.href} className={`group bg-gradient-to-br ${item.color} backdrop-blur-md rounded-xl p-5 border hover:scale-105 transition-all duration-300`}>
                <item.icon className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-bold text-lg">{item.label}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
