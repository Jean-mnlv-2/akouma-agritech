import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Users, Lightbulb, Globe } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-muted/20 to-transparent"></div>
      <div className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-40 left-16 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse"></div>
      
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-primary">
            {t("about.title")}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            {t("about.subtitle")}
          </p>
        </div>

        {/* Story section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-20 items-center">
          <div className="px-4 lg:px-0">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">
              {t("about.story.title")}
            </h3>
            <div className="space-y-4 md:space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-base md:text-lg">{t("about.story.p1")}</p>
              <p className="text-base md:text-lg">{t("about.story.p2")}</p>
              <p className="text-base md:text-lg">{t("about.story.p3")}</p>
            </div>
          </div>
          
          <div className="relative mt-8 lg:mt-0 px-4 lg:px-0">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-natural">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                  <div key={`about-stat-${index}-${stat.label}`} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
                      {stat.number}
                    </div>
                    <div className="text-muted-foreground text-xs md:text-sm">
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
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8 md:mb-12">
            {t("about.objectives.title")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {["about.objectives.o1","about.objectives.o2","about.objectives.o3","about.objectives.o4","about.objectives.o5"].map((objective, index) => (
              <div key={`objective-${index}-${objective}`} className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-natural transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <p className="text-foreground font-medium text-sm md:text-base leading-relaxed">
                  {t(objective)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions */}
        <div className="mb-16 md:mb-20 px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8 md:mb-12">
            {t("about.solutions.title")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {["about.solutions.s1","about.solutions.s2","about.solutions.s3","about.solutions.s4","about.solutions.s5"].map((solution, index) => (
              <div key={`solution-${index}-${solution}`} className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-natural transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <p className="text-foreground font-medium text-sm md:text-base leading-relaxed">
                  {t(solution)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16 md:mb-20 px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8 md:mb-12">
            {t("about.values.title")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {values.map((value, index) => (
              <Card key={`value-${index}-${value.title}`} className="text-center group hover:shadow-natural transition-all duration-300 hover:-translate-y-2 bg-card">
                <CardContent className="p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3 group-hover:text-primary transition-colors">
                    {t(value.title)}
                  </h4>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                    {t(value.description)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team CTA */}
        <div className="text-center bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-12 shadow-natural mx-4">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">
            {t("about.join.title")}
          </h3>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("about.join.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link to="/careers">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                {t("about.join.cta.jobs")}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
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