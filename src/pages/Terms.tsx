import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LegalPage {
  id: number;
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const Terms = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [termsPage, setTermsPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    const fetchTermsPage = async () => {
      try {
        const res = await fetch('/api/legal_pages?slug=terms&isPublished=true', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch terms page');
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
      <Header />
      
      <section className="pt-24 pb-16">
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
                    dangerouslySetInnerHTML={{ __html: termsPage.content }}
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