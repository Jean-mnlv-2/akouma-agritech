import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ContactForm from "@/components/forms/ContactForm";
import { useCountries } from "@/hooks/use-countries";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { api } from "@/integrations/api/client";
import { 
  Handshake, 
  Users, 
  Globe, 
  TrendingUp, 
  Lightbulb,
  Star,
  Zap,
  Shield,
  Rocket,
  Mail,
  Building,
  Send,
  CheckCircle,
} from "lucide-react";
import heroAgritech from "@/assets/hero-agritech.jpg";

interface PartnerRow {
  id: number;
  name: string;
  logo?: string;
  logoUrl?: string;
  imageUrl?: string;
  type?: string;
  description?: string;
  year?: string;
  website?: string;
  contact?: string;
  order?: number;
}

const Partnerships = () => {
  const { toast } = useToast();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const { countries, updatePhoneWithCode } = useCountries();
  const { execute: executeRecaptcha } = useRecaptcha();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [_contactForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    partnershipType: "",
    message: ""
  });
  const [partnershipForm, setPartnershipForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    country_id: "",
    partnershipType: "",
    description: "",
    budget: "",
    timeline: ""
  });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch('/api/partners');
        if (!res.ok) throw new Error('Failed to fetch partners');
        const body = await res.json();
        const list = ((Array.isArray(body) ? body : body?.data) || []) as PartnerRow[];
        setPartners(
          list
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        );
      } catch (e) {
        console.warn('Impossible de charger les partenaires', e);
      }
    };
    fetchPartners();
  }, [toast]);

  const partnershipTypes = [
    {
      icon: Users,
      title: "Partenariats Stratégiques",
      description: "Collaborations avec des organisations agricoles, institutions de recherche et entreprises technologiques pour développer des solutions innovantes.",
      benefits: ["Accès aux dernières technologies", "Partage d'expertise", "Développement de nouveaux marchés"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Globe,
      title: "Partenariats Internationaux",
      description: "Alliances avec des partenaires internationaux pour étendre notre impact et partager les meilleures pratiques agricoles.",
      benefits: ["Échange de connaissances", "Accès aux marchés internationaux", "Innovation collaborative"],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Partenariats Commerciaux",
      description: "Collaborations avec des distributeurs, revendeurs et intégrateurs pour étendre notre présence sur le marché.",
      benefits: ["Expansion géographique", "Augmentation des ventes", "Support client localisé"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Lightbulb,
      title: "Partenariats R&D",
      description: "Collaborations avec des universités, centres de recherche et startups pour développer de nouvelles technologies agricoles.",
      benefits: ["Innovation continue", "Propriété intellectuelle partagée", "Tests et validation"],
      color: "from-orange-500 to-red-500"
    }
  ];

  // Les partenaires sont désormais chargés depuis l'API (table partners)

  const partnershipBenefits = [
    {
      icon: Star,
      title: "Innovation Continue",
      description: "Accès aux dernières technologies et méthodologies agricoles"
    },
    {
      icon: Zap,
      title: "Croissance Rapide",
      description: "Expansion accélérée grâce aux synergies partenariales"
    },
    {
      icon: Shield,
      title: "Risques Partagés",
      description: "Répartition des risques et des investissements"
    },
    {
      icon: Rocket,
      title: "Impact Multiplié",
      description: "Amplification de notre impact sur l'agriculture durable"
    }
  ];

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnershipForm.name || !partnershipForm.email || !partnershipForm.description || !partnershipForm.partnershipType || !partnershipForm.country_id) {
      toast({ title: "Erreur de validation", description: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      const countryName = countries.find(c => String(c.id) === partnershipForm.country_id)?.name || null;
      const recaptchaToken = await executeRecaptcha('partnerships');
      await api.request('POST', '/api/partnerships', {
        body: {
          contactName: partnershipForm.name,
          companyName: partnershipForm.company || partnershipForm.name,
          email: partnershipForm.email,
          phone: partnershipForm.phone || null,
          country: countryName,
          partnershipType: partnershipForm.partnershipType,
          message: partnershipForm.description,
          budget: partnershipForm.budget || null,
          timeline: partnershipForm.timeline || null,
          recaptchaToken,
        },
      });
      toast({ title: "Demande envoyée", description: "Nous vous recontactons rapidement." });
      setPartnershipForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        country_id: "",
        partnershipType: "",
        description: "",
        budget: "",
        timeline: ""
      });
      setIsPartnershipOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande", variant: "destructive" });
    }
  };

  const handlePartnershipInputChange = (field: keyof typeof partnershipForm, value: string) => {
    setPartnershipForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'country_id') {
        next.phone = updatePhoneWithCode(prev.phone, value);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Partenariats"
        description="Rejoignez notre réseau de partenaires innovants et contribuez à révolutionner l'agriculture africaine avec des solutions technologiques durables."
        image="/kilimo-logo.png"
      />
      <Header />
      
      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroAgritech} 
            alt="Agriculture intelligente" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
          {/* Animated background decorations */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center z-10">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm bg-primary/10 text-primary border-2 border-primary/20 hover:scale-105 transition-transform">
              <Handshake className="w-4 h-4 mr-2" />
              Partenariats Stratégiques
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Ensemble pour l'Agriculture de Demain
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Rejoignez notre réseau de partenaires innovants et contribuez à révolutionner 
              l'agriculture africaine avec des solutions technologiques durables.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog open={isPartnershipOpen} onOpenChange={setIsPartnershipOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    Devenir Partenaire
                    <Handshake className="ml-2 transition-transform group-hover:scale-110" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Demande de Partenariat</DialogTitle>
                    <DialogDescription>
                      Remplissez ce formulaire pour nous présenter votre projet de partenariat.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handlePartnershipSubmit} className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          value={partnershipForm.name}
                          onChange={(e) => handlePartnershipInputChange("name", e.target.value)}
                          placeholder="Votre nom complet"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={partnershipForm.email}
                          onChange={(e) => handlePartnershipInputChange("email", e.target.value)}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Entreprise/Organisation</Label>
                        <Input
                          id="company"
                          value={partnershipForm.company}
                          onChange={(e) => handlePartnershipInputChange("company", e.target.value)}
                          placeholder="Nom de votre organisation"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={partnershipForm.phone}
                          onChange={(e) => handlePartnershipInputChange("phone", e.target.value)}
                          placeholder="+237 XXX XXX XXX"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Pays</Label>
                        <Select value={partnershipForm.country_id} onValueChange={(value) => handlePartnershipInputChange("country_id", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre pays" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {countries.map((c) => (
                              <SelectItem key={c.code || c.id} value={c.id?.toString() || c.name}>
                                {c.name} ({c.phoneCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="partnershipType">Type de Partenariat *</Label>
                        <Select value={partnershipForm.partnershipType} onValueChange={(value) => handlePartnershipInputChange("partnershipType", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strategic">Partenariat Stratégique</SelectItem>
                            <SelectItem value="international">Partenariat International</SelectItem>
                            <SelectItem value="commercial">Partenariat Commercial</SelectItem>
                            <SelectItem value="rd">Partenariat R&D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description du Projet *</Label>
                      <Textarea
                        id="description"
                        value={partnershipForm.description}
                        onChange={(e) => handlePartnershipInputChange("description", e.target.value)}
                        placeholder="Décrivez votre projet de partenariat..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="budget">Budget Estimé</Label>
                        <Select value={partnershipForm.budget} onValueChange={(value) => handlePartnershipInputChange("budget", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une fourchette" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-10k">0 - 10K €</SelectItem>
                            <SelectItem value="10k-50k">10K - 50K €</SelectItem>
                            <SelectItem value="50k-100k">50K - 100K €</SelectItem>
                            <SelectItem value="100k+">100K+ €</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timeline">Délai de Réalisation</Label>
                        <Select value={partnershipForm.timeline} onValueChange={(value) => handlePartnershipInputChange("timeline", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un délai" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-6m">0 - 6 mois</SelectItem>
                            <SelectItem value="6m-1y">6 mois - 1 an</SelectItem>
                            <SelectItem value="1y-2y">1 - 2 ans</SelectItem>
                            <SelectItem value="2y+">2+ ans</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer la Demande
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsPartnershipOpen(false)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Nous Contacter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <ContactForm source="partnerships" onSuccess={() => setIsContactOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Types - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-background to-primary/5 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Types de Partenariats
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Nous proposons différents modèles de collaboration adaptés à vos objectifs et à votre secteur d'activité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {partnershipTypes.map((type, index) => {
              const delay = index * 100;
              return (
                <Card 
                  key={`partnership-type-${index}-${type.title}`} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 cursor-pointer bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                  onClick={() => setIsPartnershipOpen(true)}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="text-center pb-4 relative z-10">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${type.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <type.icon className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground mb-4 text-center leading-relaxed">
                      {type.description}
                    </p>
                    <ul className="space-y-2">
                      {type.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-foreground transition-colors">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-center">
                      <Badge variant="secondary" className="cursor-pointer hover:scale-105 transition-transform">
                        En savoir plus sur le partenariat {type.title}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nos Partenaires Actuels
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les organisations qui nous font confiance et contribuent à notre mission.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => (
              <Card key={`partner-${index}-${partner.name}`} className="text-center hover:shadow-md transition-shadow duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                    {partner.logoUrl || partner.imageUrl ? (
                      <img src={partner.logoUrl || partner.imageUrl} alt={partner.name} className="w-full h-full object-cover" />
                    ) : partner.logo ? (
                      <span>{partner.logo}</span>
                    ) : (
                      <Handshake className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">
                    {partner.type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-muted-foreground mb-3"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(partner.description || "") }}
                  />
                  <p className="text-xs text-primary font-medium mb-3">
                    {partner.year ? `Partenaire depuis ${partner.year}` : ''}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 mr-1" />
                      {partner.contact}
                    </div>
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Building className="w-3 h-3 mr-1" />
                      {partner.website}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi Partenarier avec KILIMO ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez un écosystème innovant et bénéficiez d'avantages uniques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnershipBenefits.map((benefit, index) => (
              <div key={`benefit-${index}-${benefit.title}`} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <benefit.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à Rejoindre l'Aventure ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Ensemble, créons l'avenir de l'agriculture africaine. 
              Contactez-nous pour discuter de votre projet de partenariat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="group" onClick={() => setIsPartnershipOpen(true)}>
                <Handshake className="mr-2 transition-transform group-hover:scale-110" />
                Devenir Partenaire
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" onClick={() => setIsContactOpen(true)}>
                Nous Contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partnerships;
