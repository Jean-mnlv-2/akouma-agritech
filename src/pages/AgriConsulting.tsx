import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
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
  Calendar,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useContactSettings } from "@/hooks/use-contact-settings";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { AppHeroBanner } from "@/components/pwa/AppHeroBanner";
import heroAgritech from "@/assets/hero-agritech.jpg?format=webp&quality=75";

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
  const isStandalone = useStandalonePwa();
  const [showContactForm, setShowContactForm] = useState(false);
  const { data: contact } = useContactSettings();

  const seo = (
    <SEO
      title="Agri-Consulting - Conseil agricole expert | KILIMO Agritech"
      description="Diagnostic, conseil technique, formation et accompagnement agronomique sur mesure pour exploitations et coopératives partout en Afrique."
      path={typeof window !== 'undefined' ? `${window.location.origin}/agri-consulting` : undefined}
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <AppHeroBanner image={heroAgritech} title="Agri-Consulting" subtitle="Conseil agricole expert" />
        <AppPageHeader title="Agri-Consulting" backTo="/menu" subtitle="Conseil agricole expert" />
        <div className="px-4 pt-4 pb-8 space-y-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Expertise et accompagnement stratégique pour transformer votre agriculture et maximiser votre rentabilité.
          </p>

          <section className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10 text-xs">
              <Sparkles className="w-3 h-3 mr-1.5" /> Accès immédiat
            </Badge>
            <h2 className="text-base font-bold mb-1.5">Besoin d'une réponse tout de suite ?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Notre assistant IA donne un accès instantané à une partie de cette expertise, 24h/24 — sans rendez-vous.
            </p>
            <Button asChild size="sm" className="w-full">
              <Link to="/pricing"><MessageSquare className="w-3.5 h-3.5 mr-2" />Voir les forfaits de l'assistant IA</Link>
            </Button>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Nos services de conseil</h2>
            <div className="space-y-2.5">
              {services.map((service, index) => (
                <div key={`service-${index}-${service.title}`} className="rounded-2xl border border-border/60 p-3.5">
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-10 h-10 bg-gradient-tech rounded-xl flex items-center justify-center shrink-0">
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-0.5">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {service.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Transformation numérique</h2>
            {digitalServices.map((service, index) => (
              <div key={`digital-${index}-${service.title}`} className="rounded-2xl border border-border/60 p-3.5">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shrink-0">
                    <service.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {service.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" /><span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Nos clients</h2>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector, index) => (
                <span key={`sector-${index}-${sector}`} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-muted text-xs font-medium">
                  <Users className="w-3 h-3 text-primary" />{sector}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-muted/50 p-4">
            {showContactForm ? (
              <>
                <h2 className="text-base font-bold mb-3">Demande de consultation</h2>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{contact?.phone || '+237 233 XX XX XX'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{contact?.email || 'contact@kilimo.cm'}</span>
                  </div>
                </div>
                <ContactForm />
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-base font-bold mb-2">Prêt à transformer votre agriculture ?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Bénéficiez de l'expertise de nos consultants pour maximiser vos rendements.
                </p>
                <Button className="w-full" onClick={() => setShowContactForm(true)}>
                  Demander une consultation<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />

      {/* Hero Section - Modern Design */}
      <section className="pt-16 sm:pt-28 pb-10 sm:pb-16 md:pb-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        {/* Animated background decorations */}
        <div className="hidden sm:block absolute top-20 right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="hidden sm:block absolute bottom-32 left-16 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="hidden sm:block absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-3 sm:mb-6 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:scale-105 transition-transform text-xs sm:text-sm">
              <Target className="w-4 h-4 mr-2" />
              Services de Conseil Agricole
            </Badge>
            <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 text-white leading-tight">
              Agri-<span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Consulting</span>
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl text-white/90 mb-4 sm:mb-10 leading-relaxed">
              Expertise et accompagnement stratégique pour transformer votre agriculture
              et maximiser votre rentabilité
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setShowContactForm(true)}
                className="group transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                Consultation gratuite
                <Calendar className="w-4 h-4 ml-2 transition-transform group-hover:scale-110" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                Nos références
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-background to-primary/5 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Notre Mission
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Fournir des services d'accompagnement, d'expertise et de stratégie aux acteurs du secteur agricole 
              pour améliorer la <span className="text-primary font-bold">productivité</span>, 
              la <span className="text-primary font-bold">rentabilité</span>, 
              la <span className="text-primary font-bold">durabilité</span> et 
              la <span className="text-primary font-bold">résilience</span> de leurs activités.
            </p>
          </div>
        </div>
      </section>

      {/* Accès instantané via l'assistant IA — complément aux consultants humains */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
                <Sparkles className="w-4 h-4 mr-2" />
                Accès immédiat
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Besoin d'une réponse tout de suite ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                En complément de l'accompagnement humain ci-dessous, notre assistant IA donne un accès
                instantané à une partie de cette expertise agronomique, 24h/24 — sans rendez-vous.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Forfait Standard</CardTitle>
                  <CardDescription>
                    Itinéraires techniques des cultures, fiches sanitaires et conseils de lutte —
                    l'expertise technique au quotidien.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-primary/40">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Forfait Premium</CardTitle>
                  <CardDescription>
                    Diagnostic environnemental, planification technico-économique complète, stratégie
                    de gestion et accès marché — l'équivalent digital de ce que nos consultants
                    proposent ci-dessous.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button asChild size="lg">
                <Link to="/pricing">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Voir les forfaits de l'assistant IA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, index) => {
              const delay = index * 100;
              return (
                <Card 
                  key={`service-${index}-${service.title}`} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 h-full bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-tech rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <service.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors mb-3">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <ul className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
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
                        <p className="text-sm text-muted-foreground">{contact?.email || 'contact@kilimo.cm'}</p>
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