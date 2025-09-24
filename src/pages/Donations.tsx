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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ContactForm from "@/components/forms/ContactForm";
import { api } from "@/integrations/api/client";
import { 
  Heart, 
  Users, 
  Globe, 
  Target, 
  Award,
  Lightbulb,
  Sprout,
  Star,
  Zap,
  Shield,
  Rocket,
  Gift,
  TrendingUp,
  CheckCircle,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Building,
  Send,
  ExternalLink
} from "lucide-react";
import heroAgritech from "@/assets/hero-agritech.jpg";

interface Country {
  id: number;
  code: string;
  name: string;
  phoneCode: string;
}

const Donations = () => {
  const { toast } = useToast();
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [donationForm, setDonationForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country_id: "",
    amount: "",
    paymentMethod: "card",
    anonymous: false,
    message: "",
    newsletter: true
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: ""
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
    fetchCountries();
  }, [toast]);

  const donationTiers = [
    {
      id: "basic",
      name: "Soutien de Base",
      amount: "25",
      description: "Contribution essentielle pour nos projets locaux",
      benefits: [
        "Newsletter mensuelle",
        "Mise à jour des projets",
        "Certificat de donateur"
      ],
      color: "from-green-500 to-emerald-500",
      popular: false
    },
    {
      id: "agricultural",
      name: "Partenaire Agricole",
      amount: "100",
      description: "Soutien significatif pour nos programmes de formation",
      benefits: [
        "Tous les avantages précédents",
        "Invitation aux événements",
        "Rapport trimestriel détaillé",
        "Nom sur notre mur des donateurs"
      ],
      color: "from-blue-500 to-cyan-500",
      popular: true
    },
    {
      id: "innovator",
      name: "Innovateur Agritech",
      amount: "250",
      description: "Contribution majeure pour nos projets de recherche",
      benefits: [
        "Tous les avantages précédents",
        "Visite de nos installations",
        "Rencontre avec nos équipes",
        "Participation aux décisions stratégiques"
      ],
      color: "from-purple-500 to-pink-500",
      popular: false
    },
    {
      id: "visionary",
      name: "Visionnaire du Futur",
      amount: "500",
      description: "Soutien exceptionnel pour nos projets d'expansion",
      benefits: [
        "Tous les avantages précédents",
        "Partenariat personnalisé",
        "Dédicace sur nos produits",
        "Statut de membre honoraire"
      ],
      color: "from-orange-500 to-red-500",
      popular: false
    }
  ];

  const [impacts, setImpacts] = useState<any[]>([]);

  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const [impRes, stoRes] = await Promise.all([
          fetch('/api/donation_impacts'),
          fetch('/api/success_stories'),
        ]);
        const [impBody, stoBody] = await Promise.all([
          impRes.ok ? impRes.json() : Promise.resolve({ data: [] }),
          stoRes.ok ? stoRes.json() : Promise.resolve({ data: [] }),
        ]);
        setImpacts(((Array.isArray(impBody) ? impBody : impBody?.data) || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
        setStories(((Array.isArray(stoBody) ? stoBody : stoBody?.data) || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (e) {
        console.error(e);
      }
    };
    fetchSections();
  }, []);

  const donationStats = [
    { value: "1500+", label: "Donateurs" },
    { value: "250K€", label: "Collectés" },
    { value: "15", label: "Projets Financés" },
    { value: "5000+", label: "Vies Impactées" }
  ];

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.name || !donationForm.email || !donationForm.amount) {
      toast({ title: "Erreur de validation", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    const amountNumber = parseFloat(donationForm.amount.replace(/[^\d.]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant numérique valide.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: donationForm.name,
          email: donationForm.email,
          phone: donationForm.phone || null,
          company: donationForm.company || null,
          country_id: donationForm.country_id ? parseInt(donationForm.country_id) : null,
          amount: amountNumber,
          payment_method: donationForm.paymentMethod,
          anonymous: donationForm.anonymous,
          message: donationForm.message || null,
          newsletter: donationForm.newsletter,
          payment_reference: null,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Don enregistré", description: "Merci pour votre générosité. Un reçu vous sera envoyé." });
      setDonationForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        country_id: "",
        amount: "",
        paymentMethod: "card",
        anonymous: false,
        message: "",
        newsletter: true
      });
      setSelectedTier("");
      setIsDonationOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'enregistrer le don", variant: "destructive" });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setDonationForm(prev => {
      const next: any = { ...prev, [field]: value };
      if (field === 'country_id' && typeof value === 'string') {
        const selected = countries.find(c => c.id.toString() === value);
        if (selected?.phoneCode) {
          const code = selected.phoneCode;
          if (!next.phone || !next.phone.startsWith(code)) {
            next.phone = code + ' ' + (next.phone?.replace(/^\+?\d+\s*/, '') || '');
          }
        }
      }
      return next;
    });
  };

  const handleContactInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    const tier = donationTiers.find(t => t.id === tierId);
    if (tier) {
      setDonationForm(prev => ({ ...prev, amount: tier.amount }));
    }
  };

  const openDonationModal = (tierId?: string) => {
    if (tierId) {
      setSelectedTier(tierId);
      const tier = donationTiers.find(t => t.id === tierId);
      if (tier) {
        setDonationForm(prev => ({ ...prev, amount: tier.amount }));
      }
    }
    setIsDonationOpen(true);
  };

  return (
    <div className="min-h-screen">
      <TitleManager 
        title="Dons"
        description="Votre don contribue directement à révolutionner l'agriculture africaine. Chaque contribution fait une différence réelle dans la vie des agriculteurs."
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
              <Heart className="w-4 h-4 mr-2" />
              Soutenez Notre Mission
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ensemble, Cultivons l'Avenir
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Votre don contribue directement à révolutionner l'agriculture africaine. 
              Chaque contribution, quelle qu'elle soit, fait une différence réelle dans la vie des agriculteurs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90" onClick={() => openDonationModal()}>
                <Heart className="mr-2 transition-transform group-hover:scale-110" />
                Faire un Don
              </Button>
              <Button variant="outline" size="lg" onClick={() => setIsContactOpen(true)}>
                Découvrir nos Projets
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {donationStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez Votre Niveau de Soutien
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chaque niveau de don offre des avantages uniques et contribue à des projets spécifiques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {donationTiers.map((tier, index) => (
              <Card key={index} className={`relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer ${tier.popular ? 'ring-2 ring-primary' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                    Plus Populaire
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center text-white`}>
                    <Gift className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{tier.amount}€</div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={tier.popular ? "default" : "outline"} onClick={() => openDonationModal(tier.id)}>
                    Choisir ce Niveau
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Votre Don en Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment vos contributions transforment concrètement l'agriculture africaine.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {impacts.map((area, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="w-6 h-6 text-primary text-lg">{area.icon || '🎯'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{area.title}</h3>
                    <p className="text-muted-foreground mb-4">{area.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{area.target || ''}</span>
                    <span className="text-primary font-medium">{area.target || ''}</span>
                  </div>
                  <Progress value={area.progress ?? 0} className="h-2" />
                  <div className="text-right text-sm text-muted-foreground">
                    {area.progress ?? 0}% atteint
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Histoires de Succès
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les réalisations concrètes rendues possibles grâce à vos dons.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{story.imageUrl ? '🖼️' : '🏆'}</span>
                  </div>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">
                    {story.year || ''}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {story.description}
                  </p>
                  <div className="text-sm font-medium text-primary">
                    Impact : {story.impact}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à Faire la Différence ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Chaque don, quel qu'il soit, contribue à créer un avenir meilleur 
              pour l'agriculture africaine et ses communautés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="group" onClick={() => openDonationModal()}>
                <Heart className="mr-2 transition-transform group-hover:scale-110" />
                Faire un Don Maintenant
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" onClick={() => setIsContactOpen(true)}>
                Nous Contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Modal */}
      <Dialog open={isDonationOpen} onOpenChange={setIsDonationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Faire un Don</DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire pour soutenir notre mission. Tous les dons sont sécurisés et tracés.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDonationSubmit} className="space-y-6 mt-6">
            {/* Sélection du niveau */}
            <div>
              <Label className="text-base font-medium">Niveau de Don</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {donationTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTier === tier.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleTierSelect(tier.id)}
                  >
                    <div className="font-medium">{tier.name}</div>
                    <div className="text-lg font-bold text-primary">{tier.amount}€</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={donationForm.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Votre nom complet"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={donationForm.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={donationForm.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+237 XXX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="company">Entreprise/Organisation</Label>
                <Input
                  id="company"
                  value={donationForm.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Nom de votre organisation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select value={donationForm.country_id} onValueChange={(value) => handleInputChange("country_id", value)}>
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
                <Label htmlFor="amount">Montant du Don *</Label>
                <Input
                  id="amount"
                  value={donationForm.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="Montant en euros"
                  required
                />
              </div>
            </div>

            {/* Méthode de paiement */}
            <div>
              <Label className="text-base font-medium">Méthode de Paiement</Label>
              <RadioGroup
                value={donationForm.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    Carte bancaire
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                    <Building className="w-4 h-4" />
                    Virement bancaire
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={donationForm.anonymous}
                  onCheckedChange={(checked) => handleInputChange("anonymous", checked as boolean)}
                />
                <Label htmlFor="anonymous" className="cursor-pointer">
                  Don anonyme
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={donationForm.newsletter}
                  onCheckedChange={(checked) => handleInputChange("newsletter", checked as boolean)}
                />
                <Label htmlFor="newsletter" className="cursor-pointer">
                  Recevoir notre newsletter
                </Label>
              </div>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                value={donationForm.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Un message pour notre équipe..."
                rows={3}
              />
            </div>

            {/* Sécurité */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                Vos informations sont protégées et sécurisées
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                <Heart className="w-4 h-4 mr-2" />
                Procéder au Paiement
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDonationOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-w-lg">
          <ContactForm source="donations" onSuccess={() => setIsContactOpen(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Donations;
