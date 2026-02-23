import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, Users, Briefcase, Send, Loader2 } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface Career {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  employmentType: string;
  department?: string;
  salaryRange?: string;
  isPublished: boolean;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

const Careers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyTitle, setApplyTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [applyForm, setApplyForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const { data, error } = await api
          .from('careers')
          .select('*')
          .eq('isPublished', true)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching careers:', error);
        } else {
          setCareers(data || []);
        }
      } catch (error) {
        console.error('Error fetching careers:', error);
      } finally {
        setLoadingCareers(false);
      }
    };

    fetchCareers();
  }, []);

  const handleApply = (careerTitle: string) => {
    setApplyTitle(careerTitle);
    setApplyForm({ name: "", email: "", phone: "", message: "" });
    setIsApplyOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.name || !applyForm.email) {
      toast({ title: "Erreur", description: "Nom et email sont requis.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: applyForm.name,
          email: applyForm.email,
          phone: applyForm.phone || null,
          project_type: `Candidature: ${applyTitle}`,
          message: applyForm.message || `Candidature pour le poste: ${applyTitle}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Candidature envoyée !", description: "Nous examinerons votre candidature rapidement." });
      setIsApplyOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'envoyer la candidature. Réessayez.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'CDI';
      case 'part-time': return 'Temps partiel';
      case 'contract': return 'Contrat';
      case 'internship': return 'Stage';
      case 'freelance': return 'Freelance';
      default: return type;
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return <LoadingSpinner size="large" text="Chargement des opportunités de carrière..." />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Rejoignez <span className="text-primary">AKOUMA</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Participez à la révolution agricole africaine. Construisons ensemble l'avenir 
                de l'agriculture connectée et durable.
              </p>
            </div>

            {/* Company Values */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Équipe Diverse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Une équipe multiculturelle unie par la passion de l'innovation agricole
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-tech rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Innovation Continue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Environnement stimulant où créativité et technologie se rencontrent
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-nature rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Impact Réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Travail ayant un impact direct sur la vie des agriculteurs africains
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Job Listings */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center mb-8">Postes Disponibles</h2>
              
              {loadingCareers ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={`career-skeleton-${i}`} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-5 bg-muted rounded w-20"></div>
                          <div className="h-5 bg-muted rounded w-24"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-muted rounded w-full mb-2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : careers.length > 0 ? (
                <div className="space-y-6">
                  {careers.map((career) => (
                    <Card key={career.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl mb-2">{career.title}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              {career.department && <Badge variant="secondary">{career.department}</Badge>}
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {career.location}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getEmploymentTypeLabel(career.employmentType)}
                              </Badge>
                              {career.salaryRange && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {career.salaryRange}
                                </Badge>
                              )}
                            </div>
                            {career.applicationDeadline && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Candidature jusqu'au {formatDeadline(career.applicationDeadline)}
                              </div>
                            )}
                          </div>
                          <Button variant="hero" onClick={() => handleApply(career.title)}>
                            <Send className="w-4 h-4 mr-2" />
                            Postuler
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: career.description }} />
                        {career.requirements && (
                          <div>
                            <h4 className="font-semibold mb-2">Compétences requises :</h4>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: career.requirements }} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune offre d'emploi disponible</h3>
                      <p className="text-muted-foreground">
                        Consultez cette page régulièrement pour découvrir de nouvelles opportunités.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Candidature Spontanée */}
            <Card className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Candidature Spontanée</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Vous ne trouvez pas le poste qui vous correspond ? 
                  Envoyez-nous votre candidature spontanée !
                </p>
                <Button variant="hero" size="lg" onClick={() => handleApply('Candidature spontanée')}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer ma candidature
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  careers@akouma.bf | +226 25 XX XX XX
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Postuler</DialogTitle>
            <DialogDescription>{applyTitle}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div>
              <Label htmlFor="apply-name">Nom complet *</Label>
              <Input id="apply-name" value={applyForm.name} onChange={(e) => setApplyForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom complet" required />
            </div>
            <div>
              <Label htmlFor="apply-email">Email *</Label>
              <Input id="apply-email" type="email" value={applyForm.email} onChange={(e) => setApplyForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.com" required />
            </div>
            <div>
              <Label htmlFor="apply-phone">Téléphone</Label>
              <Input id="apply-phone" value={applyForm.phone} onChange={(e) => setApplyForm(f => ({ ...f, phone: e.target.value }))} placeholder="+226 XX XX XX XX" />
            </div>
            <div>
              <Label htmlFor="apply-message">Motivation / Message</Label>
              <Textarea id="apply-message" value={applyForm.message} onChange={(e) => setApplyForm(f => ({ ...f, message: e.target.value }))} placeholder="Parlez-nous de vous et de votre motivation..." rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi en cours...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Envoyer ma candidature</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Careers;
