import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, BarChart3, Megaphone, SlidersHorizontal, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { openCookiePreferences } from "@/lib/cookieConsent";

type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: "HTTP" | "localStorage" | "sessionStorage";
};

type Category = {
  id: "necessary" | "analytics" | "preferences" | "marketing";
  icon: React.ReactNode;
  title: string;
  legalBasis: string;
  purpose: string;
  cookies: CookieRow[];
};

const CATEGORIES: Category[] = [
  {
    id: "necessary",
    icon: <Lock className="w-5 h-5" aria-hidden />,
    title: "Strictement nécessaires",
    legalBasis: "Intérêt légitime (exempté de consentement — art. 82 LIL)",
    purpose:
      "Indispensables au fonctionnement du site : authentification, sécurité (CSRF, anti-abus), panier d'achat, équilibrage de charge. Sans eux, les services demandés ne peuvent être fournis.",
    cookies: [
      { name: "auth_token", provider: "KILIMO", purpose: "Session utilisateur authentifiée (JWT court)", duration: "1 heure", type: "HTTP" },
      { name: "refresh_token", provider: "KILIMO", purpose: "Renouvellement sécurisé de session (httpOnly)", duration: "14 jours", type: "HTTP" },
      { name: "csrf_token", provider: "KILIMO", purpose: "Protection contre les attaques CSRF", duration: "Session", type: "HTTP" },
      { name: "kilimo_cookie_consent", provider: "KILIMO", purpose: "Mémorisation de vos préférences de cookies", duration: "13 mois", type: "localStorage" },
      { name: "kilimo_anon_id", provider: "KILIMO", purpose: "Identifiant anonyme pour l'audit du consentement (CNIL)", duration: "13 mois", type: "localStorage" },
      { name: "kilimo_cart", provider: "KILIMO", purpose: "Contenu du panier avant paiement", duration: "30 jours", type: "localStorage" },
    ],
  },
  {
    id: "analytics",
    icon: <BarChart3 className="w-5 h-5" aria-hidden />,
    title: "Mesure d'audience",
    legalBasis: "Consentement (art. 82 LIL / art. 6-1-a RGPD)",
    purpose:
      "Nous aident à comprendre l'usage du site (pages consultées, performance, parcours) afin de l'améliorer. Les données sont agrégées et pseudonymisées avant analyse.",
    cookies: [
      { name: "_ga", provider: "Google Analytics 4 (chargé uniquement après consentement)", purpose: "Distinction des utilisateurs anonymisés", duration: "13 mois", type: "HTTP" },
      { name: "_ga_*", provider: "Google Analytics 4", purpose: "Persistance de l'état de session GA4", duration: "13 mois", type: "HTTP" },
    ],
  },
  {
    id: "preferences",
    icon: <SlidersHorizontal className="w-5 h-5" aria-hidden />,
    title: "Préférences",
    legalBasis: "Consentement",
    purpose: "Mémorisent vos choix (langue, région, thème clair/sombre) pour personnaliser votre expérience à chaque visite.",
    cookies: [
      { name: "KILIMO-ui-theme", provider: "KILIMO", purpose: "Thème d'interface préféré", duration: "12 mois", type: "localStorage" },
      { name: "i18nextLng", provider: "KILIMO", purpose: "Langue d'affichage préférée", duration: "12 mois", type: "localStorage" },
    ],
  },
  {
    id: "marketing",
    icon: <Megaphone className="w-5 h-5" aria-hidden />,
    title: "Marketing",
    legalBasis: "Consentement",
    purpose:
      "Permettent de mesurer l'efficacité de nos campagnes publicitaires et de vous proposer des contenus adaptés en dehors du site. Aucun tag n'est chargé sans votre accord explicite.",
    cookies: [
      { name: "_fbp", provider: "Meta Pixel (chargé uniquement après consentement)", purpose: "Attribution des campagnes publicitaires Meta/Facebook", duration: "3 mois", type: "HTTP" },
    ],
  },
];

const Cookies = () => {
  return (
    <>
      <Helmet>
        <title>Politique de cookies — KILIMO</title>
        <meta
          name="description"
          content="Politique de cookies KILIMO : finalités, durée et fournisseurs pour chaque catégorie. Gérez librement vos préférences, à tout moment."
        />
        <link rel="canonical" href="https://akouma-agritech.lovable.app/cookies" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Cookie className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Confidentialité</p>
            <h1 className="text-3xl md:text-4xl font-bold">Politique de cookies</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
          Cette page explique quels cookies et technologies similaires (localStorage, sessionStorage) sont utilisés
          sur KILIMO, dans quel but, pour combien de temps, et par quels fournisseurs. Conformément au RGPD et aux
          recommandations de la CNIL, refuser est aussi simple qu'accepter, et vos préférences sont modifiables à
          tout moment.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          <Button onClick={() => openCookiePreferences()}>
            <ShieldCheck className="w-4 h-4 mr-2" aria-hidden />
            Gérer mes préférences
          </Button>
          <Button asChild variant="outline">
            <Link to="/privacy">Politique de confidentialité</Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Qu'est-ce qu'un cookie ?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed space-y-3">
            <p>
              Un cookie est un petit fichier déposé sur votre appareil lorsque vous visitez un site. Il permet au
              site de mémoriser des informations sur votre visite (langue, session, préférences).
            </p>
            <p>
              Certains cookies sont strictement nécessaires au fonctionnement du service. Les autres — mesure
              d'audience, préférences, marketing — nécessitent votre consentement préalable et explicite avant
              tout dépôt.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <Card key={cat.id} id={cat.id} className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">{cat.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {cat.title}
                      <Badge variant="secondary" className="font-normal">{cat.legalBasis}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 leading-relaxed">{cat.purpose}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Finalité</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cat.cookies.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="font-mono text-xs">{c.name}</TableCell>
                          <TableCell className="text-sm">{c.provider}</TableCell>
                          <TableCell className="text-sm">{c.purpose}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{c.duration}</TableCell>
                          <TableCell className="text-xs">{c.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Vos droits</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed space-y-3">
            <p>
              Vous pouvez à tout moment retirer votre consentement via le bouton « Gérer mes préférences »
              ci-dessus ou dans le pied de page. La révocation est immédiate : les scripts non essentiels sont
              désactivés et les cookies associés sont supprimés sur cette session.
            </p>
            <p>
              Pour toute question relative à vos données, contactez notre délégué à la protection des données à
              l'adresse <a href="mailto:dpo@kilimo.africa" className="text-primary hover:underline">dpo@kilimo.africa</a>.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default Cookies;