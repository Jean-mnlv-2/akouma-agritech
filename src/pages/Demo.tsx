import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries } from "@/hooks/use-countries";
import { PlayCircle, Smartphone, Monitor, Calendar, Phone, Download, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/use-recaptcha";

const Demo = () => {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { countries, updatePhoneWithCode } = useCountries();
  const { execute: executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'country') {
        return {
          ...next,
          phone: updatePhoneWithCode(prev.phone, value)
        };
      }
      return next;
    });
  };

  const demoOptions = [
    {
      id: "mobile",
      title: "Application Mobile",
      description: "Découvrez notre app de gestion des cultures en temps réel",
      icon: Smartphone,
      duration: "15 min",
      features: ["Suivi des cultures", "Alertes météo", "Recommandations IA"]
    },
    {
      id: "web",
      title: "Plateforme Web",
      description: "Explorez notre dashboard de gestion agricole complet",
      icon: Monitor,
      duration: "20 min",
      features: ["Analytics avancées", "Gestion multi-parcelles", "Rapports détaillés"]
    },
    {
      id: "iot",
      title: "Capteurs IoT",
      description: "Testez nos capteurs intelligents en action",
      icon: PlayCircle,
      duration: "25 min",
      features: ["Mesures en temps réel", "Données précises", "Connectivité longue portée"]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: "Erreur", description: "Nom et email sont requis.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const recaptchaToken = await executeRecaptcha('demo');
      const res = await fetch('/api/demo_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          country: formData.country || 'Non spécifié',
          message: `${selectedDemo ? `Type de démo: ${selectedDemo}. ` : ''}${formData.message}`,
          recaptchaToken
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Demande envoyée !", description: "Nous vous contacterons sous 24h pour planifier votre démonstration." });
      setFormData({ name: "", email: "", phone: "", company: "", country: "", message: "" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Réessayez.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadBrochure = () => {
    const link = document.createElement('a');
    link.href = '/demo-brochure-kilimo.pdf';
    link.download = 'KILIMO-Brochure-Solutions.pdf';
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Découvrez KILIMO en Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choisissez le type de démonstration qui vous intéresse et voyez comment 
            nos solutions peuvent transformer votre agriculture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {demoOptions.map((demo) => (
            <Card 
              key={demo.id} 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedDemo === demo.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedDemo(demo.id)}
            >
              <CardContent className="p-6 text-center">
                <demo.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{demo.title}</h3>
                <p className="text-muted-foreground mb-4">{demo.description}</p>
                <div className="text-sm text-primary font-medium mb-4">Durée: {demo.duration}</div>
                <div className="space-y-2">
                  {demo.features.map((feature, index) => (
                    <div key={`demo-${demo.id}-feature-${index}`} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Planifier une Démonstration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nom complet *</Label>
                  <Input placeholder="Votre nom" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" placeholder="votre@email.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
                </div>
                <div>
                  <Label>Pays *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name} ({country.phoneCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input placeholder="+237 XX XX XX XX" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input placeholder="Votre entreprise" value={formData.company} onChange={(e) => handleInputChange("company", e.target.value)} />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea placeholder="Parlez-nous de vos besoins..." value={formData.message} onChange={(e) => handleInputChange("message", e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={!selectedDemo || isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi en cours...</>
                  ) : (
                    <><Phone className="w-4 h-4 mr-2" />Planifier un appel</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Télécharger notre brochure</h3>
                <p className="text-muted-foreground mb-6">
                  Obtenez un aperçu détaillé de toutes nos solutions et leurs avantages.
                </p>
                <Button onClick={handleDownloadBrochure} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger la brochure PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Démo immédiate disponible</h3>
                <p className="text-muted-foreground mb-6">
                  Nos experts sont disponibles pour une démonstration en direct.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Voir la démo maintenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Démonstration Interactive KILIMO</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PlayCircle className="w-20 h-20 text-primary mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground">
                          Démonstration interactive de notre plateforme
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          (Vidéo de démonstration serait intégrée ici)
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Demo;
