import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";

interface LegalPage {
  id: number;
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const Legal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    const fetchLegalPage = async () => {
      try {
        const url = new URL('/api/legal_pages?slug=legal&isPublished=true', apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch legal page');
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Réponse invalide du serveur pour la page légale');
        }
        const { data } = await res.json();
        
        if (data && data.length > 0) {
          setLegalPage(data[0]);
        }
      } catch (error) {
        console.error('Error fetching legal page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLegalPage();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="large" text="Chargement des mentions légales..." />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {legalPage ? legalPage.title : 'Mentions Légales'}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Informations légales sur KILIMO et nos services.
              </p>
            </div>

            {legalPage ? (
              <Card>
                <CardContent className="pt-6">
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: legalPage.content }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Cette page sera bientôt disponible. Veuillez contacter l'administrateur.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Legal;
