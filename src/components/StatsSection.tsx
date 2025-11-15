import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Leaf, Award, Target, Globe } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { useEffect, useState } from 'react';

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "home.stats.farmers",
    description: "home.stats.farmers_desc",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    value: "25%",
    label: "home.stats.yield",
    description: "home.stats.yield_desc",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Leaf,
    value: "30%",
    label: "home.stats.cost",
    description: "home.stats.cost_desc",
    color: "from-primary to-green-600"
  },
  {
    icon: Award,
    value: "15",
    label: "home.stats.experts",
    description: "home.stats.experts_desc",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Target,
    value: "8",
    label: "home.stats.countries",
    description: "home.stats.countries_desc",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Globe,
    value: "50M€",
    label: "home.stats.savings",
    description: "home.stats.savings_desc",
    color: "from-accent to-blue-600"
  }
];

const StatsSection = () => {
  const { t } = useI18n();
  const [countersVisible, setCountersVisible] = useState(false);
  const sectionRef = useScrollReveal({ threshold: 0.2 });

  useEffect(() => {
    if (sectionRef.isVisible) {
      const timer = setTimeout(() => setCountersVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [sectionRef.isVisible]);

  return (
    <section 
      ref={sectionRef.elementRef}
      className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden"
    >
      {/* Enhanced background decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('home.stats.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('home.stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const delay = index * 100;
            return (
              <Card 
                key={stat.label} 
                className={`text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-md border border-border/50 overflow-hidden ${
                  sectionRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: `${delay}ms`,
                  animation: countersVisible ? 'none' : undefined
                }}
              >
                <CardContent className="p-6 relative">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  <div className={`relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  
                  <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 transition-all duration-300 ${
                    countersVisible ? 'scale-100' : 'scale-0'
                  }`}>
                    {stat.value}
                  </div>
                  
                  <div className="text-sm md:text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {t(stat.label)}
                  </div>
                  
                  <div className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {t(stat.description)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
