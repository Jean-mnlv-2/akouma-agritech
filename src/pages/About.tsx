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
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src={heroAgritech} 
            alt="À propos d'AKOUMA"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-green-600/80 text-white">À propos d'AKOUMA</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Mettre la <span className="text-green-400">technologie</span> au service de la terre
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              AKOUMA accompagne les producteurs, coopératives et territoires dans la transition 
              vers une agriculture moderne, résiliente et connectée.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Notre Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sectors.map((sector, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                    <sector.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{sector.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {sector.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
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
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
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
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
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