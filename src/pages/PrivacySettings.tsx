import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, ShieldAlert, Loader2, Cookie } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { openCookiePreferences } from "@/lib/cookieConsent";

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.auth.getUser().then(({ data }: any) => {
      setIsLoggedIn(!!data?.user);
      if (!data?.user) navigate("/auth");
    });
  }, [navigate]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const payload = await api.request("GET", "/api/me/export");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kilimo-mes-donnees-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Export prêt", description: "Le téléchargement de vos données a démarré." });
    } catch (error) {
      toast({
        title: "Échec de l'export",
        description: "Une erreur est survenue. Réessayez dans quelques instants.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.request("DELETE", "/api/me");
      toast({ title: "Compte supprimé", description: "Vos données personnelles ont été effacées." });
      await api.auth.signOut().catch(() => void 0);
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Suppression impossible",
        description: error?.message?.includes("last_admin")
          ? "Vous êtes le dernier compte administrateur actif : transférez ce rôle avant de supprimer votre compte."
          : "Une erreur est survenue. Réessayez ou contactez le support.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoggedIn === null) return null;

  return (
    <>
      <SEO
        title="Confidentialité et données"
        description="Exportez ou supprimez vos données personnelles KILIMO à tout moment, conformément au RGPD."
        path="/privacy-settings"
        noindex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Confidentialité et données</h1>
        <p className="text-muted-foreground mb-8">
          Gérez vos données personnelles conformément au RGPD : consultez, exportez ou supprimez
          les informations liées à votre compte KILIMO.
        </p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Exporter mes données
              </CardTitle>
              <CardDescription>
                Téléchargez une archive JSON de toutes vos données personnelles : profil, commandes,
                cours suivis, avis, certificats, conversations avec l'assistant et abonnement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Télécharger mes données
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-primary" />
                Préférences de cookies
              </CardTitle>
              <CardDescription>
                Modifiez à tout moment votre consentement pour les cookies analytiques, marketing
                et de préférences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => openCookiePreferences()}>
                Gérer mes préférences de cookies
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Votre email, nom et téléphone seront définitivement effacés et votre compte
                désactivé. Vos conversations avec l'assistant et votre historique de consentement
                cookies seront supprimés. Les commandes, factures et certificats sont conservés de
                façon anonymisée, comme l'exige la réglementation comptable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Supprimer définitivement mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression du compte ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Vous serez immédiatement déconnecté et ne
                      pourrez plus vous reconnecter avec cet email.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Oui, supprimer mon compte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacySettings;
