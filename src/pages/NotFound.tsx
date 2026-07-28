import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { useI18n } from "@/i18n";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    console.warn("404: route inconnue —", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t("notfound.meta.title") || "Page introuvable"}
        description={t("notfound.meta.desc") || "La page que vous recherchez n'existe pas ou a été déplacée."}
        path={location.pathname}
        noindex
      />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <Card className="w-full max-w-md border-2">
          <CardContent className="p-8 sm:p-10 text-center">
            <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Compass className="w-10 h-10 text-primary" />
            </div>
            <p className="text-6xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent mb-2">
              404
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold mb-3">
              {t("notfound.heading") || "Page introuvable"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("notfound.desc") || "Désolé, la page que vous cherchez n'existe pas, a été déplacée ou retirée."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("notfound.cta.back") || "Page précédente"}
              </Button>
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t("notfound.cta.home") || "Retour à l'accueil"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
