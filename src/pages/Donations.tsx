import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ContactForm from "@/components/forms/ContactForm";
import { useCountries } from "@/hooks/use-countries";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { api } from "@/integrations/api/client";
import { usePublicStats } from "@/hooks/use-public-stats";
import { trackDonation } from "@/lib/analyticsEvents";
import {
  Heart,
  Gift,
  CheckCircle,
  CreditCard,
  Lock,
  Building,
  Trophy,
} from "lucide-react";
import heroAgritech from "@/assets/hero-agritech.jpg";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";

const Donations = () => {
  const isStandalone = useStandalonePwa();
  const { toast } = useToast();
  const { data: publicStats } = usePublicStats();
  const [searchParams] = useSearchParams();
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const { countries, updatePhoneWithCode } = useCountries();
  const { execute: executeRecaptcha } = useRecaptcha();
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
    newsletter: false,
    donationImpactId: ""
  });
  // contactForm state removed - using ContactForm component instead

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
        const [impBody, stoBody] = await Promise.all([
          api.request('GET', '/api/donation_impacts').catch(() => ({ data: [] })),
          api.request('GET', '/api/success_stories').catch(() => ({ data: [] })),
        ]);
        setImpacts(((Array.isArray(impBody) ? impBody : impBody?.data) || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
        setStories(((Array.isArray(stoBody) ? stoBody : stoBody?.data) || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (e) {
        console.error(e);
      }
    };
    fetchSections();
  }, []);

  // Arrivée depuis "Soutenir ce projet" (cartes de la page d'accueil) :
  // /donations?project=<slug> — on cible la cause correspondante, on la met
  // en évidence et on pré-sélectionne le projet dans le formulaire de don.
  const projectSlug = searchParams.get('project');
  const linkedProject = useMemo(
    () => (projectSlug ? impacts.find((i) => i.slug === projectSlug) : undefined),
    [projectSlug, impacts]
  );

  useEffect(() => {
    if (!linkedProject) return;
    const el = document.getElementById(`impact-${linkedProject.slug}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setDonationForm((prev) => ({ ...prev, donationImpactId: String(linkedProject.id) }));
  }, [linkedProject]);

  // Chiffres réels uniquement — seuls les dons dont le statut a été changé
  // manuellement par un admin après réception effective du paiement sont
  // comptés (voir GET /api/stats/public côté serveur). Un don "pending"
  // n'est pas de l'argent réellement collecté.
  const formatEuros = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K€` : `${n}€`;
  const donationStats = [
    { value: publicStats ? `${publicStats.totalDonors}` : "—", label: "Donateurs" },
    { value: publicStats ? formatEuros(publicStats.totalDonated) : "—", label: "Collectés" },
    { value: publicStats ? `${publicStats.totalDonationImpacts}` : "—", label: "Projets Financés" },
    { value: publicStats ? `${publicStats.totalConfirmedDonations}` : "—", label: "Dons Reçus" },
  ];

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.name || !donationForm.email || !donationForm.amount || !donationForm.country_id) {
      toast({ title: "Erreur de validation", description: "Veuillez remplir tous les champs obligatoires (nom, email, pays, montant).", variant: "destructive" });
      return;
    }
    const amountNumber = parseFloat(donationForm.amount.replace(/[^\d.]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant numérique valide.", variant: "destructive" });
      return;
    }
    try {
      const countryName = countries.find(c => String(c.id) === donationForm.country_id)?.name || null;
      const recaptchaToken = await executeRecaptcha('donations');
      await api.request('POST', '/api/donations', {
        body: {
          donorName: donationForm.name,
          email: donationForm.email,
          amount: amountNumber,
          country: countryName,
          message: donationForm.message || null,
          donationImpactId: donationForm.donationImpactId ? Number(donationForm.donationImpactId) : undefined,
          recaptchaToken,
        },
      });
      toast({ title: "Don enregistré", description: "Merci pour votre générosité. Un reçu vous sera envoyé." });
      trackDonation(amountNumber);
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
        newsletter: false,
        donationImpactId: ""
      });
      setSelectedTier("");
      setIsDonationOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'enregistrer le don", variant: "destructive" });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setDonationForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'country_id' && typeof value === 'string') {
        return {
          ...next,
          phone: updatePhoneWithCode(prev.phone, value)
        };
      }
      return next;
    });
  };

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    const tier = donationTiers.find(t => t.id === tierId);
    if (tier) {
      setDonationForm(prev => ({ ...prev, amount: tier.amount }));
    }
  };

  const openDonationModal = (tierId?: string, donationImpactId?: number) => {
    if (tierId) {
      setSelectedTier(tierId);
      const tier = donationTiers.find(t => t.id === tierId);
      if (tier) {
        setDonationForm(prev => ({ ...prev, amount: tier.amount }));
      }
    }
    if (donationImpactId != null) {
      setDonationForm(prev => ({ ...prev, donationImpactId: String(donationImpactId) }));
    }
    setIsDonationOpen(true);
  };

  const seo = (
    <SEO
      title="Dons"
      description="Votre don contribue directement à révolutionner l'agriculture africaine. Chaque contribution fait une différence réelle dans la vie des agriculteurs."
      image="/kilimo-logo.png"
    />
  );

  const donationDialog = (
    <Dialog open={isDonationOpen} onOpenChange={setIsDonationOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Faire un Don</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour soutenir notre mission. Tous les dons sont sécurisés et tracés.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDonationSubmit} className="space-y-6 mt-6">
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

          <div>
            <Label htmlFor="donationImpact" className="text-base font-medium">Projet soutenu (optionnel)</Label>
            <Select
              value={donationForm.donationImpactId}
              onValueChange={(value) => handleInputChange("donationImpactId", value)}
            >
              <SelectTrigger id="donationImpact" className="mt-2">
                <SelectValue placeholder="Don général — sans projet spécifique" />
              </SelectTrigger>
              <SelectContent>
                {impacts.map((impact) => (
                  <SelectItem key={impact.id} value={String(impact.id)}>
                    {impact.icon || '🎯'} {impact.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <Label htmlFor="country">Pays</Label>
              <Select value={donationForm.country_id} onValueChange={(value) => handleInputChange("country_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((country) => (
                    <SelectItem key={country.code || country.id} value={country.id?.toString() || country.name}>
                      {country.name} ({country.phoneCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={donationForm.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+237 XXX XXX XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Entreprise/Organisation</Label>
              <Input
                id="company"
                value={donationForm.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Nom de votre organisation"
              />
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

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Vos informations sont protégées et sécurisées
            </div>
          </div>

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
  );

  const contactDialog = (
    <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
      <DialogContent className="max-w-lg">
        <ContactForm source="donations" onSuccess={() => setIsContactOpen(false)} />
      </DialogContent>
    </Dialog>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <AppPageHeader title="Faire un don" backTo="/menu" subtitle="Ensemble, cultivons l'avenir" />
        <div className="px-4 pt-4 pb-8 space-y-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre don contribue directement à révolutionner l'agriculture africaine. Chaque contribution fait une différence réelle.
          </p>

          <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={() => openDonationModal()}>
            <Heart className="w-4 h-4 mr-2" />Faire un don
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            {donationStats.map((stat, index) => (
              <div key={`donation-stat-${index}-${stat.label}`} className="rounded-2xl border border-border/60 p-3 text-center">
                <p className="text-xl font-black text-primary leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Choisissez votre niveau de soutien</h2>
            <div className="space-y-2.5">
              {donationTiers.map((tier, index) => (
                <button
                  key={`tier-${index}-${tier.id}`}
                  onClick={() => openDonationModal(tier.id)}
                  className={`w-full text-left rounded-2xl border p-3.5 relative ${tier.popular ? "border-primary ring-1 ring-primary/30" : "border-border/60"}`}
                >
                  {tier.popular && <Badge className="absolute -top-2.5 right-3 bg-primary text-white text-xs">Populaire</Badge>}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center text-white shrink-0`}>
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{tier.name}</p>
                      <p className="text-lg font-black text-primary leading-none">{tier.amount}€</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                  <ul className="space-y-1">
                    {tier.benefits.slice(0, 2).map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" /><span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </section>

          {impacts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Votre don en action</h2>
              <div className="space-y-2.5">
                {impacts.map((area, index) => {
                  const isFunded = area.targetAmount != null;
                  const isLinked = linkedProject?.id === area.id;
                  return (
                    <div
                      key={`impact-${index}-${area.title}`}
                      id={`impact-${area.slug}`}
                      className={`rounded-2xl border p-3.5 ${isLinked ? "border-primary ring-1 ring-primary/30" : "border-border/60"}`}
                    >
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-base">{area.icon || '🎯'}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold mb-1">{area.title}</h3>
                          <p
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(area.description || "") }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {isFunded ? (
                            <>
                              <span>{formatEuros(area.raisedAmount ?? 0)} collectés</span>
                              <span className="text-primary font-medium">Objectif : {formatEuros(Number(area.targetAmount))}</span>
                            </>
                          ) : (
                            <span>{area.target || ''}</span>
                          )}
                        </div>
                        <Progress value={area.progress ?? 0} className="h-1.5" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{area.progress ?? 0}% atteint</span>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openDonationModal(undefined, area.id)}>
                            <Heart className="w-3 h-3 mr-1.5" />Faire un don
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {stories.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Histoires de succès</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar">
                {stories.map((story, index) => (
                  <div key={`story-${index}-${story.title}`} className="shrink-0 w-56 snap-start rounded-2xl border border-border/60 bg-card p-3.5">
                    <div className="w-12 h-12 mx-auto mb-2.5 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                      {story.imageUrl ? (
                        <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-center mb-1">{story.title}</p>
                    <p
                      className="text-xs text-muted-foreground text-center line-clamp-3 mb-2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(story.description || "") }}
                    />
                    <p className="text-xs font-medium text-primary text-center">Impact : {story.impact}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-gradient-to-r from-primary to-accent text-white p-5 text-center">
            <h2 className="text-lg font-bold mb-2">Prêt à faire la différence ?</h2>
            <p className="text-sm opacity-90 mb-4">
              Chaque don contribue à créer un avenir meilleur pour l'agriculture africaine.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button variant="secondary" className="w-full" onClick={() => openDonationModal()}>
                <Heart className="w-4 h-4 mr-2" />Faire un don maintenant
              </Button>
              <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-primary" onClick={() => setIsContactOpen(true)}>
                Nous contacter
              </Button>
            </div>
          </section>
        </div>
        {donationDialog}
        {contactDialog}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {seo}
      <Header />

      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-10 sm:pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroAgritech}
            alt="Agriculture intelligente"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
          {/* Animated background decorations */}
          <div className="hidden sm:block absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="hidden sm:block absolute bottom-32 left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative container mx-auto px-6 text-center z-10">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-3 sm:mb-6 text-xs sm:text-sm bg-primary/10 text-primary border-2 border-primary/20 hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 mr-2" />
              Soutenez Notre Mission
            </Badge>

            <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Ensemble, Cultivons l'Avenir
            </h1>

            <p className="text-sm sm:text-xl md:text-2xl text-muted-foreground mb-4 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              Votre don contribue directement à révolutionner l'agriculture africaine.
              Chaque contribution, quelle qu'elle soit, fait une différence réelle dans la vie des agriculteurs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                size="lg" 
                className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                onClick={() => openDonationModal()}
              >
                <Heart className="mr-2 transition-transform group-hover:scale-110" />
                Faire un Don
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => setIsContactOpen(true)}
              >
                Découvrir nos Projets
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-background to-primary/5 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {donationStats.map((stat, index) => {
              const delay = index * 100;
              const colors = [
                "from-blue-500 to-cyan-500",
                "from-green-500 to-emerald-500",
                "from-yellow-500 to-orange-500",
                "from-purple-500 to-pink-500"
              ];
              return (
                <div 
                  key={`donation-stat-${index}-${stat.label}`} 
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {donationTiers.map((tier, index) => {
              const delay = index * 100;
              return (
                <Card 
                  key={`tier-${index}-${tier.id}`} 
                  className={`relative group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 cursor-pointer bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden ${tier.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
                  onClick={() => openDonationModal(tier.id)}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white shadow-lg z-10">
                      Plus Populaire
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="text-center pb-4 relative z-10">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${tier.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Gift className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{tier.name}</CardTitle>
                    <div className={`text-4xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>{tier.amount}€</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <ul className="space-y-3 mb-6">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-foreground transition-colors">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                      variant={tier.popular ? "default" : "outline"}
                    >
                      Choisir ce Niveau
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
            {impacts.map((area, index) => {
              const isFunded = area.targetAmount != null;
              const isLinked = linkedProject?.id === area.id;
              return (
                <Card
                  key={`impact-${index}-${area.title}`}
                  id={`impact-${area.slug}`}
                  className={`p-6 transition-all ${isLinked ? 'ring-2 ring-primary shadow-lg' : ''}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="w-6 h-6 text-primary text-lg">{area.icon || '🎯'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{area.title}</h3>
                      <p
                        className="text-muted-foreground mb-4"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(area.description || "") }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isFunded ? (
                      <div className="flex justify-between text-sm">
                        <span>{formatEuros(area.raisedAmount ?? 0)} collectés</span>
                        <span className="text-primary font-medium">Objectif : {formatEuros(Number(area.targetAmount))}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>{area.target || ''}</span>
                      </div>
                    )}
                    <Progress value={area.progress ?? 0} className="h-2" />
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        {area.progress ?? 0}% atteint
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openDonationModal(undefined, area.id)}>
                        <Heart className="w-3.5 h-3.5" />
                        Faire un don
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
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
              <Card key={`story-${index}-${story.title}`} className="text-center hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {story.imageUrl ? (
                      <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-8 h-8 text-green-600" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">
                    {story.year || ''}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-muted-foreground mb-4"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(story.description || "") }}
                  />
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

      {donationDialog}
      {contactDialog}

      <Footer />
    </div>
  );
};

export default Donations;
