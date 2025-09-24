import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ContactForm from "@/components/forms/ContactForm";
import { api } from "@/integrations/api/client";
import { 
  Handshake, 
  Users, 
  Globe, 
  TrendingUp, 
  Award,
  Lightbulb,
  Target,
  Heart,
  Star,
  Zap,
  Shield,
  Rocket,
  Mail,
  Phone,
  Building,
  Send,
  CheckCircle,
  X
} from "lucide-react";
import heroAgritech from "@/assets/hero-agritech.jpg";

interface Country {
  id: number;
  code: string;
  name: string;
  phoneCode: string;
}

interface PartnerRow {
  id: number;
  name: string;
  logo?: string;
  type?: string;
  description?: string;
  year?: string;
  website?: string;
  contact?: string;
}

const Partnerships = () => {
  const { toast } = useToast();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [contactForm, setContactForm] = useState({
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
    const fetchCountries = async () => {
      try {
        const res = await fetch('/api/countries');
        if (!res.ok) throw new Error('Failed to fetch countries');
        const body = await res.json();
        const list = Array.isArray(body) ? body : body?.data || [];
        setCountries(list.sort((a: any, b: any) => a?.name?.localeCompare?.(b?.name || '') || 0));
      } catch (e) {
        toast({ title: "Erreur", description: "Impossible de charger les pays", variant: "destructive" });
      }
    };
    const fetchPartners = async () => {
      try {
        const res = await fetch('/api/partners');
        if (!res.ok) throw new Error('Failed to fetch partners');
        const body = await res.json();
        const list = Array.isArray(body) ? body : body?.data || [];
        setPartners(list.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)));
      } catch (e) {
        console.warn('Impossible de charger les partenaires', e);
      }
    };
    fetchCountries();
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
    if (!partnershipForm.name || !partnershipForm.email || !partnershipForm.description || !partnershipForm.partnershipType) {
      toast({ title: "Erreur de validation", description: "Champs requis manquants", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: partnershipForm.name,
          email: partnershipForm.email,
          company: partnershipForm.company || null,
          phone: partnershipForm.phone || null,
          country_id: partnershipForm.country_id ? parseInt(partnershipForm.country_id) : null,
          partnership_type: partnershipForm.partnershipType,
          description: partnershipForm.description,
          budget: partnershipForm.budget || null,
          timeline: partnershipForm.timeline || null,
        })
      });
      if (!res.ok) throw new Error(await res.text());
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

  const handlePartnershipInputChange = (field: string, value: string) => {
    setPartnershipForm(prev => {
      const next = { ...prev, [field]: value } as any;
      if (field === 'country_id') {
        const selected = countries.find(c => c.id.toString() === value);
        if (selected?.phoneCode) {
          // Préfixer le téléphone si vide ou sans indicatif
          const code = selected.phoneCode;
          if (!next.phone || !next.phone.startsWith(code)) {
            next.phone = code + ' ' + (next.phone?.replace(/^\+?\d+\s*/, '') || '');
          }
        }
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <TitleManager 
        title="Partenariats"
        description="Rejoignez notre réseau de partenaires innovants et contribuez à révolutionner l'agriculture africaine avec des solutions technologiques durables."
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroAgritech} 
            alt="Agriculture intelligente" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm">
              <Handshake className="w-4 h-4 mr-2" />
              Partenariats Stratégiques
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ensemble pour l'Agriculture de Demain
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Rejoignez notre réseau de partenaires innovants et contribuez à révolutionner 
              l'agriculture africaine avec des solutions technologiques durables.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog open={isPartnershipOpen} onOpenChange={setIsPartnershipOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="group">
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
                              <SelectItem key={c.id} value={c.id.toString()}>
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
                  <Button variant="outline" size="lg">
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

      {/* Partnership Types */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Types de Partenariats
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nous proposons différents modèles de collaboration adaptés à vos objectifs et à votre secteur d'activité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnershipTypes.map((type, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer" onClick={() => setIsPartnershipOpen(true)}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-white`}>
                    <type.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-center">
                    {type.description}
                  </p>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-center">
                    <Badge variant="secondary" className="cursor-pointer">
                      En savoir plus
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <Card key={index} className="text-center hover:shadow-md transition-shadow duration-300 group">
                <CardHeader>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{partner.logo || '🤝'}</div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">
                    {partner.type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {partner.description}
                  </p>
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
              Pourquoi Partenarier avec AKOUMA ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez un écosystème innovant et bénéficiez d'avantages uniques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnershipBenefits.map((benefit, index) => (
              <div key={index} className="text-center group">
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
