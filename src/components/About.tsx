import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Lightbulb } from "lucide-react";
import { useI18n } from "@/i18n";

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

        {/* Objectives & Solutions — côte à côte, séparées par une ligne verticale */}
        <div className="mb-16 md:mb-20 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-0 md:divide-x md:divide-border">
            {/* Objectifs */}
            <div className="md:pr-10">
              <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10 md:mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("about.objectives.title")}
              </h3>
              <div className="space-y-4">
                {["about.objectives.o1","about.objectives.o2","about.objectives.o3","about.objectives.o4","about.objectives.o5"].map((objective, index) => (
                  <div
                    key={`objective-${index}-${objective}`}
                    className="flex items-start gap-4 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-4 md:p-5 hover:shadow-lg transition-all duration-500 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <p className="text-foreground font-semibold text-sm md:text-base leading-relaxed group-hover:text-primary transition-colors">
                      {t(objective)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="md:pl-10">
              <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10 md:mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("about.solutions.title")}
              </h3>
              <div className="space-y-4">
                {["about.solutions.s1","about.solutions.s2","about.solutions.s3","about.solutions.s4","about.solutions.s5"].map((solution, index) => (
                  <div
                    key={`solution-${index}-${solution}`}
                    className="flex items-start gap-4 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl p-4 md:p-5 hover:shadow-lg transition-all duration-500 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md">
                      <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <p className="text-foreground font-semibold text-sm md:text-base leading-relaxed group-hover:text-accent transition-colors">
                      {t(solution)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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