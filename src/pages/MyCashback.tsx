import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Gift, Copy, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Link } from "react-router-dom";

interface CashbackInfo {
  code: string;
  cashbackPercent: number;
  cashbackBalance: number;
  totalCashbackEarned: number;
  usesCount: number;
}

const MyCashback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cashbackData, setCashbackData] = useState<CashbackInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCashback = async () => {
      try {
        const { data: session } = await api.auth.getSession();
        if (!session?.session?.user) {
          navigate('/auth?redirect=/my-cashback');
          return;
        }
        const res = await api.request('GET', '/api/promo-codes/my-cashback');
        setCashbackData(res.data || null);
      } catch (error) {
        console.warn('No cashback data:', error);
        setCashbackData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCashback();
  }, [navigate]);

  const handleCopy = () => {
    if (!cashbackData?.code) return;
    navigator.clipboard.writeText(cashbackData.code);
    setCopied(true);
    toast({ title: "Code copié !", description: `Le code ${cashbackData.code} a été copié.` });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(Math.round(price));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" text="Chargement..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager title="Mon Cashback" description="Consultez votre solde cashback et utilisez-le lors de vos achats" />
      <Header />

      <div className="pt-8 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Mon Cashback</h1>
            <p className="text-muted-foreground">
              Votre programme de fidélité affilié — gagnez du cashback à chaque utilisation de votre code promo
            </p>
          </div>

          {!cashbackData ? (
            <Card className="text-center py-16">
              <CardContent>
                <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Aucun programme affilié</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Vous n'avez pas encore de code promo affilié. Contactez-nous pour rejoindre notre programme partenaire.
                </p>
                <Button asChild variant="nature">
                  <Link to="/contact">Nous contacter</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Wallet className="w-8 h-8 text-primary" />
                      <Badge variant="secondary" className="text-primary bg-primary/10">Disponible</Badge>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formatPrice(cashbackData.cashbackBalance)} FCFA
                    </div>
                    <p className="text-sm text-muted-foreground">Solde cashback utilisable</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{cashbackData.cashbackPercent}%</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {formatPrice(cashbackData.totalCashbackEarned)} FCFA
                    </div>
                    <p className="text-sm text-muted-foreground">Total cumulé depuis le début</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Gift className="w-8 h-8 text-accent" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{cashbackData.usesCount}</div>
                    <p className="text-sm text-muted-foreground">Fois utilisé par vos filleuls</p>
                  </CardContent>
                </Card>
              </div>

              {/* Promo Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Votre Code Promo</CardTitle>
                  <CardDescription>
                    Partagez ce code avec vos contacts. Vous gagnez {cashbackData.cashbackPercent}% de cashback sur chaque commande passée avec votre code.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg">
                    <div className="text-2xl font-mono font-bold text-primary flex-1">
                      {cashbackData.code}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? "Copié" : "Copier"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* How it works */}
              <Card>
                <CardHeader>
                  <CardTitle>Comment ça marche ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-lg font-bold text-primary">1</span>
                      </div>
                      <h4 className="font-semibold mb-1">Partagez</h4>
                      <p className="text-sm text-muted-foreground">Partagez votre code promo avec vos contacts</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-lg font-bold text-primary">2</span>
                      </div>
                      <h4 className="font-semibold mb-1">Ils achètent</h4>
                      <p className="text-sm text-muted-foreground">Vos filleuls utilisent le code lors de leurs achats</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-lg font-bold text-primary">3</span>
                      </div>
                      <h4 className="font-semibold mb-1">Vous gagnez</h4>
                      <p className="text-sm text-muted-foreground">Recevez {cashbackData.cashbackPercent}% de cashback utilisable sur vos commandes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center">
                <Button asChild size="lg" variant="nature">
                  <Link to="/shop">Utiliser mon cashback en boutique</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyCashback;
