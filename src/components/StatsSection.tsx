import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Leaf, Award, Target, Globe } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "home.stats.farmers",
    description: "home.stats.farmers_desc"
  },
  {
    icon: TrendingUp,
    value: "25%",
    label: "home.stats.yield",
    description: "home.stats.yield_desc"
  },
  {
    icon: Leaf,
    value: "30%",
    label: "home.stats.cost",
    description: "home.stats.cost_desc"
  },
  {
    icon: Award,
    value: "15",
    label: "home.stats.experts",
    description: "home.stats.experts_desc"
  },
  {
    icon: Target,
    value: "8",
    label: "home.stats.countries",
    description: "home.stats.countries_desc"
  },
  {
    icon: Globe,
    value: "50M€",
    label: "home.stats.savings",
    description: "home.stats.savings_desc"
  }
];

const StatsSection = () => {
  const { t } = useI18n();

  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div className="absolute top-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('home.stats.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground mb-1">
                  {t(stat.label)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t(stat.description)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
