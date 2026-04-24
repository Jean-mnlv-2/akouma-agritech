import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Users, Lightbulb, Globe } from "lucide-react";
import { useI18n } from "@/i18n";

const values = [
  {
    icon: Target,
    title: "about.values.mission.title",
    description: "about.values.mission.desc"
  },
  {
    icon: Lightbulb,
    title: "about.values.innovation.title",
    description: "about.values.innovation.desc"
  },
  {
    icon: Globe,
    title: "about.values.sustainability.title",
    description: "about.values.sustainability.desc"
  },
  {
    icon: Users,
    title: "about.values.collaboration.title",
    description: "about.values.collaboration.desc"
  }
];

const stats = [
  { number: "2020", label: "about.stats.founded" },
  { number: "15", label: "about.stats.experts" },
  { number: "8", label: "about.stats.countries" },
  { number: "50M€", label: "about.stats.savings" }
];

const About = () => {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-muted/30 via-muted/10 to-transparent"></div>
      <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-40 left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t("about.title")}
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            {t("about.subtitle")}
          </p>
        </div>

        {/* Story section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-20 items-center">
          <div className="px-4 lg:px-0 order-2 lg:order-1">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6 md:mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("about.story.title")}
            </h3>
            <div className="space-y-5 md:space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-base md:text-lg lg:text-xl">{t("about.story.p1")}</p>
              <p className="text-base md:text-lg lg:text-xl">{t("about.story.p2")}</p>
              <p className="text-base md:text-lg lg:text-xl">{t("about.story.p3")}</p>
            </div>
          </div>
          
          <div className="relative mt-8 lg:mt-0 px-4 lg:px-0 order-1 lg:order-2">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                  <div 
                    key={`about-stat-${index}-${stat.label}`} 
                    className="text-center group hover:scale-105 transition-transform duration-300"
                  >
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                      {stat.number}
                    </div>
                    <div className="text-muted-foreground text-xs md:text-sm font-medium">
                      {t(stat.label)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-16 md:mb-20 px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12 md:mb-16 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("about.objectives.title")}
          </h3>
          
          <div className="flex md:grid overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-6 md:gap-8 snap-x snap-mandatory hide-scrollbar">
            {["about.objectives.o1","about.objectives.o2","about.objectives.o3","about.objectives.o4","about.objectives.o5"].map((objective, index) => {
              const delay = index * 100;
              return (
                <div 
                  key={`objective-${index}-${objective}`} 
                  className="min-w-[280px] sm:min-w-[320px] md:min-w-0 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden snap-center"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Target className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <p className="text-foreground font-semibold text-base md:text-lg leading-relaxed group-hover:text-primary transition-colors">
                      {t(objective)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Solutions */}
        <div className="mb-16 md:mb-20 px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12 md:mb-16 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("about.solutions.title")}
          </h3>
          
          <div className="flex md:grid overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-6 md:gap-8 snap-x snap-mandatory hide-scrollbar">
            {["about.solutions.s1","about.solutions.s2","about.solutions.s3","about.solutions.s4","about.solutions.s5"].map((solution, index) => {
              const delay = index * 100;
              return (
                <div 
                  key={`solution-${index}-${solution}`} 
                  className="min-w-[280px] sm:min-w-[320px] md:min-w-0 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden snap-center"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Lightbulb className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <p className="text-foreground font-semibold text-base md:text-lg leading-relaxed group-hover:text-accent transition-colors">
                      {t(solution)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16 md:mb-20 px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12 md:mb-16 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("about.values.title")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => {
              const delay = index * 100;
              return (
                <Card 
                  key={`value-${index}-${value.title}`} 
                  className="text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-6 md:p-8 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <value.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <h4 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 group-hover:text-primary transition-colors">
                      {t(value.title)}
                    </h4>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {t(value.description)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team CTA */}
        <div className="text-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20 rounded-2xl p-8 md:p-12 lg:p-16 shadow-xl hover:shadow-2xl transition-all duration-500 mx-4">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("about.join.title")}
          </h3>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
            {t("about.join.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link to="/careers" className="group">
              <Button variant="default" size="lg" className="w-full sm:w-auto group-hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
                {t("about.join.cta.jobs")}
              </Button>
            </Link>
            <Link to="/#contact" className="group">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 group-hover:scale-105 transition-transform duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                {t("about.join.cta.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;