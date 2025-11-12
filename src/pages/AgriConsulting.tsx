import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ContactForm } from "@/components/forms/ContactForm";
import { 
  Target, 
  TrendingUp, 
  Users, 
  BookOpen, 
  BarChart3, 
  Leaf, 
  Cpu,
  FileText,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { useContactSettings } from "@/hooks/use-contact-settings";

const services = [
  {
    icon: Target,
    title: "Diagnostic et Évaluation",
    description: "Analyse complète de vos pratiques agricoles",
    features: [
      "Analyse de sol et climat",
      "Évaluation des performances techniques",
      "Audit économique d'exploitation",
      "Identification des points d'amélioration"
    ]
  },
  {
    icon: TrendingUp,
    title: "Conseil Technique",
    description: "Optimisation de vos techniques culturales",
    features: [
      "Choix des cultures et rotations",
      "Gestion fertilisation et irrigation",
      "Protection phytosanitaire",
      "Intégration pratiques agroécologiques"
    ]
  },
  {
    icon: BarChart3,
    title: "Appui à la Gestion",
    description: "Structuration et optimisation de votre business",
    features: [
      "Plans d'affaires agricoles",
      "Dossiers de financement",
      "Gestion économique et financière",
      "Stratégies de commercialisation"
    ]
  },
  {
    icon: BookOpen,
    title: "Formation & Transfert",
    description: "Montée en compétences de vos équipes",
    features: [
      "Formation des producteurs",
      "Formation des techniciens",
      "Vulgarisation technologique",
      "Accompagnement personnalisé"
    ]
  },
  {
    icon: FileText,
    title: "Développement de Projets",
    description: "Conception et pilotage de projets agricoles",
    features: [
      "Études de faisabilité",
      "Montage de projets agro-industriels",
      "Suivi-évaluation projets",
      "Recherche de financements"
    ]
  },
  {
    icon: Leaf,
    title: "Transition Agroécologique",
    description: "Accompagnement vers une agriculture durable",
    features: [
      "Systèmes agroforestiers",
      "Conservation des sols",
      "Agriculture biologique",
      "Pratiques régénératrices"
    ]
  }
];

const digitalServices = [
  {
    icon: Cpu,
    title: "Agriculture de Précision",
    description: "Technologies avancées pour optimiser vos rendements",
    features: [
      "Capteurs IoT pour monitoring",
      "Systèmes d'irrigation intelligents",
      "Drones pour surveillance cultures",
      "Analyse de données agricoles"
    ]
  }
];

const sectors = [
  "Agriculteurs individuels",
  "Coopératives agricoles",
  "Agro-industries",
  "ONG et associations",
  "Institutions publiques",
  "Projets de développement",
  "Investisseurs agricoles"
];

const AgriConsulting = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const { data: contact } = useContactSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/10 text-white border-white/20">
              Services de Conseil Agricole
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Agri-Consulting
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Expertise et accompagnement stratégique pour transformer votre agriculture 
              et maximiser votre rentabilité
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setShowContactForm(true)}
                className="group"
              >
                Consultation gratuite
                <Calendar className="w-4 h-4 ml-2 transition-transform group-hover:scale-110" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                Nos références
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Notre Mission
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Fournir des services d'accompagnement, d'expertise et de stratégie aux acteurs du secteur agricole 
              pour améliorer la <span className="text-primary font-semibold">productivité</span>, 
              la <span className="text-primary font-semibold">rentabilité</span>, 
              la <span className="text-primary font-semibold">durabilité</span> et 
              la <span className="text-primary font-semibold">résilience</span> de leurs activités.
            </p>
          </div>
        </div>
      </section>

      {/* Services principaux */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Nos Services de Conseil
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Une approche complète et personnalisée pour chaque étape de votre développement agricole
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={`service-${index}-${service.title}`} className="group hover:shadow-natural transition-all duration-300 h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-tech rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription>
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Numériques */}
      <section className="py-16 bg-gradient-nature">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Transformation Numérique
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Intégrez les technologies modernes pour une agriculture intelligente et connectée
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
            {digitalServices.map((service, index) => (
              <Card key={`digital-service-${index}-${service.title}`} className="bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center">
                      <service.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription className="text-base">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Secteurs d'activité */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Nos Clients
              </h2>
              <p className="text-lg text-muted-foreground">
                Nous accompagnons tous les acteurs de la chaîne de valeur agricole
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sectors.map((sector, index) => (
                <Card key={`sector-${index}-${sector}`} className="p-4 text-center hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{sector}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact et CTA */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {showContactForm ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-foreground">
                    Parlons de votre projet
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Nos experts sont à votre disposition pour analyser vos besoins 
                    et vous proposer des solutions sur mesure.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Consultation téléphonique</p>
                        <p className="text-sm text-muted-foreground">{contact?.phone || '+237 233 XX XX XX'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email direct</p>
                        <p className="text-sm text-muted-foreground">{contact?.email || 'contact@akouma.cm'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Délai de réponse</p>
                        <p className="text-sm text-muted-foreground">24h maximum</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-hero rounded-xl">
                    <h3 className="text-white font-bold mb-2">Consultation Gratuite</h3>
                    <p className="text-white/90 text-sm">
                      Premier entretien de diagnostic offert pour tout nouveau client
                    </p>
                  </div>
                </div>

                {/* Contact Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Demande de consultation</CardTitle>
                    <CardDescription>
                      Remplissez ce formulaire et nous vous recontacterons rapidement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContactForm />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-6 text-foreground">
                  Prêt à Transformer Votre Agriculture ?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                  Bénéficiez de l'expertise de nos consultants agricoles pour maximiser 
                  vos rendements et optimiser votre rentabilité.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="nature"
                    onClick={() => setShowContactForm(true)}
                    className="group"
                  >
                    Demander une consultation
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Télécharger notre guide
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgriConsulting;