import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Target, 
  Users, 
  Leaf, 
  TrendingUp, 
  Globe, 
  Heart,
  Lightbulb,
  Handshake,
  Award,
  Sprout
} from "lucide-react";
import heroAgritech from "@/assets/hero-agritech.jpg";
import PageHeaderCarousel from "@/components/PageHeaderCarousel";
import { usePublicStats } from "@/hooks/use-public-stats";
import { SEO } from "@/components/SEO";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";

const About = () => {
  const isStandalone = useStandalonePwa();
  const { data: publicStats } = usePublicStats();
  const sectors = [
    {
      icon: Sprout,
      title: "Agriculture intelligente",
      description: "Pratiques de production végétale durable et innovante pour optimiser les rendements tout en préservant l'environnement."
    },
    {
      icon: Users,
      title: "Élevage intégré",
      description: "Filières animales rentables et écologiques intégrées aux systèmes de production végétale."
    },
    {
      icon: TrendingUp,
      title: "Agri-business",
      description: "Transformation, commercialisation via circuits courts, marketing agricole et vente en ligne."
    },
    {
      icon: Globe,
      title: "TIC & Agritech",
      description: "Intégration des technologies comme capteurs, données et mobile pour une agriculture connectée."
    },
    {
      icon: Leaf,
      title: "Écologie & résilience",
      description: "Pratiques agroécologiques, régénération des sols, protection des écosystèmes et recyclage des déchets."
    }
  ];

  const objectives = [
    "Valoriser les ressources agricoles locales",
    "Accroître les rendements de manière durable",
    "Créer des ponts entre innovation technologique et savoirs paysans",
    "Promouvoir l'entrepreneuriat agricole pour les jeunes et les femmes",
    "Réduire les pertes post-récolte et améliorer la traçabilité"
  ];

  const solutions = [
    {
      icon: Target,
      title: "Systèmes de culture intégrés",
      description: "Solutions complètes et rentables adaptées aux contextes locaux."
    },
    {
      icon: Globe,
      title: "Suivi digital des parcelles",
      description: "Capteurs IoT et plateformes mobiles pour un monitoring en temps réel."
    },
    {
      icon: Lightbulb,
      title: "Conseils agronomiques personnalisés",
      description: "Accompagnement technique adapté à chaque exploitation."
    },
    {
      icon: Handshake,
      title: "Chaîne de valeur complète",
      description: "Du champ à la commercialisation, solutions end-to-end."
    },
    {
      icon: Award,
      title: "Formations et accompagnement",
      description: "Développement des compétences et accès au marché."
    }
  ];

  // Chiffres réels uniquement (GET /api/stats/public) — voir la note de
  // l'audit UI/UX : les anciens chiffres ("500+ producteurs", "95%
  // satisfaction"...) n'étaient adossés à aucune donnée réelle.
  const stats = [
    { value: publicStats ? `${publicStats.totalCourses}+` : "—", label: "Cours disponibles" },
    { value: publicStats ? `${publicStats.totalSeeds}+` : "—", label: "Semences certifiées" },
    { value: publicStats ? `${publicStats.totalLearners}+` : "—", label: "Apprenants actifs" },
    { value: publicStats ? `${publicStats.totalCertificates}` : "—", label: "Certificats délivrés" },
  ];

  const seo = (
    <SEO
      title="À propos"
      description="KILIMO accompagne les producteurs, coopératives et territoires dans la transition vers une agriculture moderne, résiliente et connectée."
      path={window.location.origin + "/about"}
      image="/kilimo-logo.png"
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <AppPageHeader title="À propos" backTo="/menu" subtitle="Mettre la technologie au service de la terre" />
        <div className="px-4 pt-4 pb-8 space-y-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            KILIMO accompagne les producteurs, coopératives et territoires dans la transition vers une agriculture
            moderne, résiliente et connectée.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat, index) => (
              <div key={`about-stat-${index}-${stat.label}`} className="rounded-2xl border border-border/60 p-3 text-center">
                <p className="text-xl font-black text-primary leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
            <h2 className="text-base font-bold mb-1.5">Notre mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Créer une interface entre le terrain et la technologie, entre tradition et innovation, entre ruralité
              et modernité. Une agriculture africaine productive, verte et connectée.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Nos secteurs d'activités</h2>
            <div className="space-y-2.5">
              {sectors.map((sector, index) => (
                <div key={`about-sector-${index}-${sector.title}`} className="rounded-2xl border border-border/60 p-3.5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                    <sector.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5">{sector.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{sector.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Nos objectifs</h2>
            <div className="space-y-2">
              {objectives.map((objective, index) => (
                <div key={`objective-${index}-${objective.slice(0, 30)}`} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary-foreground text-[10px] font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{objective}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Nos solutions</h2>
            <div className="space-y-2.5">
              {solutions.map((solution, index) => (
                <div key={`solution-${index}-${solution.title}`} className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <solution.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight mb-0.5">{solution.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-hero p-6 text-center">
            <Heart className="w-10 h-10 text-primary-foreground mx-auto mb-3" />
            <h2 className="text-lg font-bold text-primary-foreground mb-2">Rejoignez l'Agriculture du Futur</h2>
            <p className="text-sm text-primary-foreground/90 mb-4">
              Découvrez comment KILIMO peut transformer votre exploitation avec nos solutions et notre accompagnement.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button asChild variant="secondary" className="w-full"><Link to="/contact">Nous contacter</Link></Button>
              <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/20"><Link to="/">Voir nos services</Link></Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {seo}
      <Header />

      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <PageHeaderCarousel
          pageKey="about"
          fallbackImage={heroAgritech}
          fallbackAlt="À propos d'KILIMO"
          overlayClassName="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/60"
        />
        
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border-2 border-primary/30 hover:scale-105 transition-transform">
              <Sprout className="w-4 h-4 mr-2" />
              À propos d'KILIMO
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Mettre la <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">technologie</span> au service de la terre
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
              KILIMO accompagne les producteurs, coopératives et territoires dans la transition 
              vers une agriculture moderne, résiliente et connectée.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => {
              const delay = index * 100;
              const colors = [
                "from-blue-500 to-cyan-500",
                "from-green-500 to-emerald-500",
                "from-yellow-500 to-orange-500",
                "from-purple-500 to-pink-500"
              ];
              return (
                <div 
                  key={`about-stat-${index}-${stat.label}`} 
                  className="text-center group hover:scale-105 transition-all duration-300"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${colors[index % colors.length]} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Notre Mission
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Créer une interface entre le terrain et la technologie, entre tradition et innovation, 
              entre ruralité et modernité. Notre vision : une agriculture africaine productive, 
              verte et connectée.
            </p>
          </div>
        </div>
      </section>

      {/* Sectors Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Secteurs d'Activités</h2>
            <p className="text-xl text-muted-foreground">
              Une approche intégrée pour transformer l'agriculture
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {sectors.map((sector, index) => {
              const delay = index * 100;
              return (
                <Card 
                  key={`about-sector-${index}-${sector.title}`} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-hero rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <sector.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{sector.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base leading-relaxed group-hover:text-foreground transition-colors">
                      {sector.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Objectives & Solutions Section — deux colonnes côte à côte, séparées
          par une ligne verticale, chacune avec sa propre liste empilée. */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0 md:divide-x md:divide-border">
            {/* Objectifs */}
            <div className="md:pr-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Objectifs</h2>
                <p className="text-lg text-muted-foreground">
                  Des ambitions claires pour l'agriculture de demain
                </p>
              </div>

              <div className="space-y-4">
                {objectives.map((objective, index) => (
                  <div key={`objective-${index}-${objective.slice(0, 30)}`} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-base leading-relaxed">{objective}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="md:pl-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Solutions</h2>
                <p className="text-lg text-muted-foreground">
                  Des outils concrets pour transformer votre agriculture
                </p>
              </div>

              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div key={`solution-${index}-${solution.title}`} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <solution.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{solution.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-hero rounded-2xl p-12 text-center">
            <Heart className="w-16 h-16 text-primary-foreground mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Rejoignez l'Agriculture du Futur
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Découvrez comment KILIMO peut transformer votre exploitation agricole 
              avec nos solutions innovantes et notre accompagnement personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/contact">Nous contacter</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 border-white/30 text-white hover:bg-white/20">
                <Link to="/#services">Voir nos services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;