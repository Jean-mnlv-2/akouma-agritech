import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, CloudRain, BarChart3, Leaf, Smartphone, Zap } from "lucide-react";
import servicesImage from "@/assets/services-tech.jpg";
import { useI18n } from "@/i18n";

const services = [
  {
    icon: Cpu,
    title: "services.iot.title",
    description: "services.iot.desc",
    features: ["services.iot.f1", "services.iot.f2", "services.iot.f3", "services.iot.f4"]
  },
  {
    icon: CloudRain,
    title: "services.weather.title",
    description: "services.weather.desc",
    features: ["services.weather.f1", "services.weather.f2", "services.weather.f3", "services.weather.f4"]
  },
  {
    icon: BarChart3,
    title: "services.analytics.title",
    description: "services.analytics.desc",
    features: ["services.analytics.f1", "services.analytics.f2", "services.analytics.f3", "services.analytics.f4"]
  },
  {
    icon: Leaf,
    title: "services.sustainable.title",
    description: "services.sustainable.desc",
    features: ["services.sustainable.f1", "services.sustainable.f2", "services.sustainable.f3", "services.sustainable.f4"]
  },
  {
    icon: Smartphone,
    title: "services.app.title",
    description: "services.app.desc",
    features: ["services.app.f1", "services.app.f2", "services.app.f3", "services.app.f4"]
  },
  {
    icon: Zap,
    title: "services.ai.title",
    description: "services.ai.desc",
    features: ["services.ai.f1", "services.ai.f2", "services.ai.f3", "services.ai.f4"]
  }
];

const Services = () => {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-gradient-nature relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("services.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("services.subtitle")}
          </p>
        </div>

        {/* Featured image */}
        <div className="mb-16 relative">
          <div className="relative rounded-2xl overflow-hidden shadow-natural">
            <img 
              src={servicesImage} 
              alt="Technologies agricoles" 
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t("services.hero.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("services.hero.desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Services grid with staggered animations */}
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-6 md:gap-8 mb-16 snap-x snap-mandatory hide-scrollbar">
          {services.map((service, index) => {
            const delay = index * 100;
            return (
              <Card 
                key={`service-${index}-${service.title}`} 
                className="min-w-[280px] sm:min-w-[320px] md:min-w-0 group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 bg-card/90 backdrop-blur-md border border-border/50 overflow-hidden relative snap-center"
                style={{
                  animationDelay: `${delay}ms`
                }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-tech rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <service.icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                    {t(service.title)}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed text-base">
                    {t(service.description)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <li 
                        key={featureIndex} 
                        className="flex items-start text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mr-3 mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="nature" size="lg" className="group">
            {t("services.cta")}
            <Zap className="transition-transform group-hover:rotate-12" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;