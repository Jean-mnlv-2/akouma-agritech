import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Award } from "lucide-react";
import { api } from "@/integrations/api/client";

interface VerifyData {
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  score?: number | null;
  issuedAt?: string | null;
}

const CertificateVerify = () => {
  const { number } = useParams();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [data, setData] = useState<VerifyData | null>(null);

  useEffect(() => {
    if (!number) return;
    api
      .request("GET", `/api/certificates/verify/${encodeURIComponent(number)}`)
      .then((res: any) => {
        setValid(!!res?.valid);
        setData(res?.data || null);
      })
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  }, [number]);

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={`Vérification du certificat ${number} - KILIMO`}
        description="Vérifiez l'authenticité d'un certificat KILIMO E-Learning."
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/certificates/verify/${number}` : undefined}
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">Vérification d'un certificat</h1>
        <p className="text-center text-muted-foreground mb-8">Plateforme officielle KILIMO E-Learning</p>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="large" text="Vérification..." /></div>
        ) : valid && data ? (
          <Card className="border-green-300 bg-green-50/30 dark:bg-green-950/10">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-1">Certificat authentique</h2>
              <p className="text-sm text-muted-foreground mb-6">Émis par KILIMO Agritech</p>
              <div className="text-left space-y-3 bg-white dark:bg-card rounded-lg p-6 border">
                <div className="flex items-center gap-3"><Award className="w-5 h-5 text-primary" /><div><div className="text-xs text-muted-foreground">Numéro</div><div className="font-semibold">{data.certificateNumber}</div></div></div>
                <div><div className="text-xs text-muted-foreground">Apprenant</div><div className="font-semibold">{data.studentName}</div></div>
                <div><div className="text-xs text-muted-foreground">Formation</div><div className="font-semibold">{data.courseTitle}</div></div>
                <div><div className="text-xs text-muted-foreground">Date de complétion</div><div>{new Date(data.completionDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                {data.score != null && (<div><div className="text-xs text-muted-foreground">Score</div><div>{data.score}%</div></div>)}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-300 bg-red-50/30 dark:bg-red-950/10">
            <CardContent className="p-8 text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Certificat introuvable</h2>
              <p className="text-muted-foreground">Le numéro <strong>{number}</strong> n'existe pas dans notre registre. Vérifiez la saisie ou contactez l'apprenant.</p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CertificateVerify;