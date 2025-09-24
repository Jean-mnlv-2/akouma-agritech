import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Briefcase, Send } from "lucide-react";
import { api } from "@/integrations/api/client";

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
  const navigate = useNavigate();

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
    // Redirection vers la page de contact avec pré-remplissage
    navigate('/contact', { 
      state: { 
        subject: `Candidature pour le poste: ${careerTitle}`,
        prefill: true
      } 
    });
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
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="large" text="Chargement des opportunités de carrière..." />;
  }


  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
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
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-5 bg-muted rounded w-20"></div>
                          <div className="h-5 bg-muted rounded w-24"></div>
                          <div className="h-5 bg-muted rounded w-16"></div>
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
                              {career.department && (
                                <Badge variant="secondary">{career.department}</Badge>
                              )}
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
                          <Button 
                            variant="hero"
                            onClick={() => handleApply(career.title)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                        Postuler
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                        <div 
                          className="text-muted-foreground mb-4 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: career.description }}
                        />
                        {career.requirements && (
                    <div>
                      <h4 className="font-semibold mb-2">Compétences requises :</h4>
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: career.requirements }}
                            />
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
                        Aucune offre d'emploi n'est actuellement disponible. 
                        Consultez cette page régulièrement pour découvrir de nouvelles opportunités.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact Section */}
            <Card className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Candidature Spontanée</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Vous ne trouvez pas le poste qui vous correspond ? 
                  Envoyez-nous votre candidature spontanée !
                </p>
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => handleApply('Candidature spontanée')}
                >
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

      <Footer />
    </div>
  );
};

export default Careers;