import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Crown,
  FileText,
  Loader2,
  Zap,
  Sprout,
  ShieldCheck,
  TrendingUp,
  Building2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

// Contenu métier par palier — la source de vérité pour ce que chaque forfait
// donne concrètement (à tenir synchronisé avec RagWorkflow.FREE_SOURCE_TYPES
// et le texte de AdminDocuments.tsx côté backend). Indexé par Plan.name.
const TIER_CONTENT: Record<
  string,
  { icon: LucideIcon; tagline: string; highlights: string[]; accent: string }
> = {
  free: {
    icon: Sprout,
    tagline: "Découvrez KILIMO gratuitement",
    accent: "text-muted-foreground",
    highlights: [
      "Semences, cours, actualités et boutique en accès libre",
      "2 questions/jour sur nos fiches techniques Standard",
    ],
  },
  starter: {
    icon: ShieldCheck,
    tagline: "L'expertise technique au quotidien",
    accent: "text-primary",
    highlights: [
      "Itinéraires techniques des cultures",
      "Fiches sanitaires et diagnostics phytosanitaires",
      "Conseils sur les modes et types de lutte",
    ],
  },
  pro: {
    icon: TrendingUp,
    tagline: "L'accompagnement agroconsulting complet",
    accent: "text-primary",
    highlights: [
      "Tout Standard, plus :",
      "Diagnostic environnemental de votre exploitation",
      "Planification technique et économique complète",
      "Stratégie de gestion adaptée à votre projet",
      "Accès marché local et international",
    ],
  },
  enterprise: {
    icon: Building2,
    tagline: "Premium sans limites, pour les organisations",
    accent: "text-primary",
    highlights: [
      "Tout Premium, plus :",
      "Requêtes illimitées",
      "Accès API dédié pour vos intégrations",
    ],
  },
};

const DEFAULT_TIER_CONTENT = TIER_CONTENT.free;

type Plan = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number | string;
  currency: string;
  dailyProMessageLimit: number;
  hasCustomDocuments: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  maxCustomDocuments: number;
  trialDays: number;
  isActive: boolean;
};

type SubscriptionResponse = {
  data: {
    id: string;
    status: string;
    isTrial: boolean;
    trialEndDate?: string | null;
    currentPeriodEnd?: string | null;
    plan: Plan;
  } | null;
  isActive: boolean;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
};

function getApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL as string;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "kilimo.onrender.com") return "https://kilimo-backend.onrender.com";
    if (window.location.hostname.includes("onrender.com")) return window.location.origin;
    if (window.location.port === "8080") return window.location.origin;
  }
  return "http://localhost:4000";
}

function formatMoney(value: number | string): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(Number(value) || 0));
}

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionResponse["data"]>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  const currentPlanId = subscription?.plan?.id || null;

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.price) - Number(b.price)),
    [plans]
  );

  useEffect(() => {
    (async () => {
      try {
        const plansRes = await api.request("GET", "/api/subscriptions/plans");
        setPlans(plansRes.data || []);

        const { data } = await api.auth.getSession();
        if (!data?.session?.user) {
          setLoading(false);
          return;
        }

        setIsAuthed(true);
        const [subscriptionRes, invoicesRes] = await Promise.all([
          api.request("GET", "/api/subscriptions/my-subscription"),
          api.request("GET", "/api/subscriptions/invoices"),
        ]);

        setSubscription(subscriptionRes.data);
        setInvoices(invoicesRes.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les forfaits.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requireAuth = () => {
    if (!isAuthed) {
      navigate(`/auth?redirect=${encodeURIComponent("/pricing")}`);
      return false;
    }
    return true;
  };

  const refreshAccountData = async () => {
    if (!isAuthed) return;
    const [subscriptionRes, invoicesRes] = await Promise.all([
      api.request("GET", "/api/subscriptions/my-subscription"),
      api.request("GET", "/api/subscriptions/invoices"),
    ]);
    setSubscription(subscriptionRes.data);
    setInvoices(invoicesRes.data || []);
  };

  const handlePlanSelection = async (plan: Plan) => {
    if (!requireAuth()) return;

    try {
      setProcessingPlanId(plan.id);

      if (Number(plan.price) <= 0 || plan.trialDays > 0) {
        await api.request("POST", "/api/subscriptions/subscribe", {
          body: { planId: plan.id },
        });
        toast.success(`Forfait ${plan.displayName} activé.`);
        await refreshAccountData();
        return;
      }

      const checkoutRes = await api.request("POST", "/api/subscriptions/checkout", {
        body: { planId: plan.id },
      });

      const orderId = checkoutRes.data?.id;
      if (!orderId) {
        throw new Error("Commande de paiement introuvable");
      }

      const paymentRes = await api.request("POST", "/api/payments/initiate", {
        body: { orderId },
      });

      const paymentUrl = paymentRes.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error("Le lien de paiement n'a pas été reçu");
      }

      window.location.href = paymentUrl;
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Impossible de lancer le paiement.";
      toast.error(message);
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!requireAuth()) return;
    try {
      setProcessingPlanId("cancel");
      await api.request("POST", "/api/subscriptions/cancel");
      toast.success("Abonnement annulé.");
      await refreshAccountData();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'annuler l'abonnement.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="large" text="Chargement des forfaits..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-10">
        <section className="mx-auto mb-10 max-w-4xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">Assistant Agriconsulting KILIMO</Badge>
          <h1 className="mb-4 text-4xl font-bold text-foreground">Le bon niveau d'accompagnement pour votre exploitation</h1>
          <p className="text-lg text-muted-foreground">
            Les contenus vitrine KILIMO (semences, cours, actualités, boutique) restent gratuits pour tous.
            Les forfaits ci-dessous débloquent l'expertise agronomique de notre assistant IA : itinéraires
            techniques, fiches sanitaires, et pour Premium, un véritable accompagnement de planification
            agropastorale.
          </p>
        </section>

        {subscription && (
          <section className="mx-auto mb-8 max-w-5xl">
            <Card>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Abonnement actuel</span>
                  </div>
                  <p className="text-lg font-semibold">{subscription.plan.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    Statut: {subscription.status}
                    {subscription.isTrial && subscription.trialEndDate
                      ? ` · Essai jusqu'au ${new Date(subscription.trialEndDate).toLocaleDateString("fr-FR")}`
                      : subscription.currentPeriodEnd
                        ? ` · Échéance ${new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}`
                        : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => navigate("/assistant")}>
                    Ouvrir le chatbot
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={processingPlanId === "cancel"}
                  >
                    {processingPlanId === "cancel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 3 forfaits actifs (Entreprise temporairement désactivé) — grille à
            3 colonnes pour que les cartes se centrent, au lieu de rester
            calées à gauche dans une 4ᵉ colonne vide. */}
        <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isProcessing = processingPlanId === plan.id;
            const isPopular = plan.name === "pro";
            const tier = TIER_CONTENT[plan.name] || DEFAULT_TIER_CONTENT;
            const TierIcon = tier.icon;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col ${isPopular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}
              >
                <CardHeader>
                  <div className="mb-1 flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ${tier.accent}`}>
                      <TierIcon className="h-5 w-5" />
                    </div>
                    {isPopular ? <Badge>Recommandé</Badge> : null}
                  </div>
                  <CardTitle>{plan.displayName}</CardTitle>
                  <p className={`text-sm font-medium ${tier.accent}`}>{tier.tagline}</p>
                  <div className="text-3xl font-bold">
                    {Number(plan.price) > 0 ? `${formatMoney(plan.price)} FCFA` : "Gratuit"}
                    {Number(plan.price) > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  {/* Ce que le client obtient concrètement — la valeur agronomique du forfait */}
                  <ul className="space-y-2.5 text-sm">
                    {tier.highlights.map((highlight, i) => {
                      const isSubHeading = highlight.endsWith(":");
                      return (
                        <li key={i} className={`flex items-start gap-2 ${isSubHeading ? "font-medium text-foreground" : ""}`}>
                          {!isSubHeading && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                          <span>{highlight}</span>
                        </li>
                      );
                    })}
                    {plan.trialDays > 0 ? (
                      <li className="flex items-start gap-2 text-primary">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{plan.trialDays} jours d'essai inclus</span>
                      </li>
                    ) : null}
                  </ul>

                  <Separator />

                  {/* Détails techniques du forfait — quota, capacité, support */}
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>
                      {plan.dailyProMessageLimit === 0
                        ? "Requêtes illimitées"
                        : `${plan.dailyProMessageLimit} requêtes Standard/Premium par jour`}
                    </li>
                    <li>
                      {plan.maxCustomDocuments === 0 && plan.hasCustomDocuments
                        ? "Base de connaissances illimitée"
                        : plan.hasCustomDocuments
                          ? `Jusqu'à ${plan.maxCustomDocuments} documents dédiés`
                          : "Sans documents dédiés"}
                    </li>
                    <li>{plan.hasPrioritySupport ? "Support prioritaire" : "Support standard"}</li>
                    {plan.hasApiAccess ? <li>Accès API dédié</li> : null}
                  </ul>

                  <div className="flex-1" />

                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || isProcessing}
                    onClick={() => handlePlanSelection(plan)}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isCurrent ? "Forfait actif" : Number(plan.price) > 0 && plan.trialDays === 0 ? "Payer ce forfait" : "Activer ce forfait"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {isAuthed && invoices.length > 0 ? (
          <section className="mx-auto mt-12 max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Mes factures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString("fr-FR")} · {formatMoney(invoice.amount)} {invoice.currency}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`${getApiBase()}/api/subscriptions/invoices/${invoice.id}/pdf`, "_blank")}
                      >
                        Télécharger PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
