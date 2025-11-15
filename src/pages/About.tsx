import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const About = () => {
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

  const stats = [
    { value: "500+", label: "Producteurs accompagnés" },
    { value: "50+", label: "Coopératives partenaires" },
    { value: "15", label: "Régions couvertes" },
    { value: "98%", label: "Satisfaction client" }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section - Modern Design */}
      <section className="relative pt-24 pb-20 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src={heroAgritech} 
            alt="À propos d'AKOUMA"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/60"></div>
          {/* Animated background decorations */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border-2 border-primary/30 hover:scale-105 transition-transform">
              <Sprout className="w-4 h-4 mr-2" />
              À propos d'AKOUMA
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Mettre la <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">technologie</span> au service de la terre
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
              AKOUMA accompagne les producteurs, coopératives et territoires dans la transition 
              vers une agriculture moderne, résiliente et connectée.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        
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

      {/* Objectives Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Objectifs</h2>
              <p className="text-xl text-muted-foreground">
                Des ambitions claires pour l'agriculture de demain
              </p>
            </div>
            
            <div className="space-y-4">
              {objectives.map((objective, index) => (
                <div key={`objective-${index}-${objective.slice(0, 30)}`} className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                  </div>
                  <p className="text-lg leading-relaxed">{objective}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Solutions</h2>
            <p className="text-xl text-muted-foreground">
              Des outils concrets pour transformer votre agriculture
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <Card key={`solution-${index}-${solution.title}`} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <solution.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
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
              Découvrez comment AKOUMA peut transformer votre exploitation agricole 
              avec nos solutions innovantes et notre accompagnement personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Nous contacter
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/30 text-white hover:bg-white/20">
                Voir nos services
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