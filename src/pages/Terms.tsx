import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import TitleManager from "@/components/TitleManager";

interface LegalPage {
  id: number;
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

const Terms = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [termsPage, setTermsPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    const fetchTermsPage = async () => {
      try {
        const url = new URL('/api/legal_pages?slug=terms&isPublished=true', apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch terms page');
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Réponse invalide du serveur pour la page des conditions');
        }
        const { data } = await res.json();
        
        if (data && data.length > 0) {
          setTermsPage(data[0]);
        }
      } catch (error) {
        console.error('Error fetching terms page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsPage();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="large" text="Chargement des conditions d'utilisation..." />;
  }


  return (
    <div className="min-h-screen">
      <TitleManager
        title="Conditions d'Utilisation"
        description="Les règles qui régissent l'utilisation des services agricoles technologiques de KILIMO."
        canonical={window.location.origin + "/terms"}
        image="/kilimo-logo.png"
      />
      <Header />
      
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {termsPage ? termsPage.title : 'Conditions d\'Utilisation'}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Les règles qui régissent l'utilisation de nos services agricoles technologiques.
              </p>
            </div>

            {termsPage ? (
              <Card>
                <CardContent className="pt-6">
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(termsPage.content)}}
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

export default Terms;
