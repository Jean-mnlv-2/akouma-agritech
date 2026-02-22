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

const Privacy = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [privacyPage, setPrivacyPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    const fetchPrivacyPage = async () => {
      try {
        const res = await fetch('/api/legal_pages?slug=privacy&isPublished=true', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch privacy page');
        const { data } = await res.json();
        
        if (data && data.length > 0) {
          setPrivacyPage(data[0]);
        }
      } catch (error) {
        console.error('Error fetching privacy page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPage();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="large" text="Chargement de la politique de confidentialité..." />;
  }


  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {privacyPage ? privacyPage.title : 'Politique de Confidentialité'}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Votre confiance est essentielle. Découvrez comment nous protégeons vos données.
              </p>
            </div>

            {privacyPage ? (
              <Card>
                <CardContent className="pt-6">
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: privacyPage.content }}
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

export default Privacy;