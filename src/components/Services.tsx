import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, Coins, Landmark, QrCode, ArrowUpRight, ExternalLink, Heart,
  Droplets, BoxSelect, ScanSearch, Cpu, Smartphone, Zap, CloudRain, BarChart3, Sprout, Bug, Microscope,
  ChevronLeft, ChevronRight, Lightbulb,
} from "lucide-react";
import ekoloHero from "@/assets/ekolo-hero.webp";
import ekoloLogo from "@/assets/ekolo-logo.png";
import { useI18n } from "@/i18n";
import { api } from "@/integrations/api/client";
import { trackOutboundClick } from "@/lib/analyticsEvents";

const EKOLO_URL = "https://ekolo.akouma.net/";
const CARDS_PER_PAGE = 3;

// Doit rester synchronisé avec SUGGESTED_ICONS dans
// AdminInnovativeSolutions.tsx — toute icône hors de cette liste (ou champ
// vide) retombe sur Lightbulb.
const ICONS: Record<string, typeof Lightbulb> = {
  Droplets, BoxSelect, ScanSearch, Leaf, Cpu, Smartphone, Zap, CloudRain, BarChart3, Sprout, Bug, Microscope,
};

const ekoloFeatures = [
  { icon: Coins, title: "home.innovation.ekolo.f1.title", desc: "home.innovation.ekolo.f1.desc" },
  { icon: Landmark, title: "home.innovation.ekolo.f2.title", desc: "home.innovation.ekolo.f2.desc" },
  { icon: QrCode, title: "home.innovation.ekolo.f3.title", desc: "home.innovation.ekolo.f3.desc" },
  { icon: Leaf, title: "home.innovation.ekolo.f4.title", desc: "home.innovation.ekolo.f4.desc" },
];

interface InnovativeSolution {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon?: string;
  features?: string[];
  donationImpact?: { slug: string; isActive: boolean } | null;
}

const Services = () => {
  const { t } = useI18n();
  const [solutions, setSolutions] = useState<InnovativeSolution[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.request('GET', '/api/innovative_solutions')
      .then((body: any) => setSolutions((Array.isArray(body) ? body : body?.data) || []))
      .catch(() => setSolutions([]));
  }, []);

  const totalPages = Math.max(1, Math.ceil(solutions.length / CARDS_PER_PAGE));
  const visibleSolutions = solutions.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  const renderCard = (solution: InnovativeSolution, className: string) => {
    const Icon = (solution.icon && ICONS[solution.icon]) || Lightbulb;
    return (
      <Card
        key={solution.id}
        className={`group hover:shadow-xl transition-all duration-500 hover:-translate-y-3 bg-card/90 backdrop-blur-md border border-border/50 overflow-hidden relative ${className}`}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <CardHeader className="relative z-10">
          <div className="w-14 h-14 bg-gradient-tech rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
            <Icon className="w-7 h-7 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
            {solution.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed text-base">
            {solution.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <ul className="space-y-3">
            {(solution.features || []).map((feature, featureIndex) => (
              <li
                key={featureIndex}
                className="flex items-start text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors"
              >
                <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full mr-3 mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {solution.donationImpact?.isActive && (
            <Button variant="outline" size="sm" className="mt-6 w-full group/support" asChild>
              <Link to={`/donations?project=${solution.donationImpact.slug}`}>
                <Heart className="transition-transform group-hover/support:scale-110" />
                {t("services.support_cta")}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="py-20 bg-gradient-nature relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("services.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("services.subtitle")}
          </p>
        </div>

        {/* Featured partner solution — Ekolo */}
        <div className="mb-16 bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-natural grid md:grid-cols-2">
          <div className="relative h-64 md:h-auto min-h-[320px]">
            <img
              src={ekoloHero}
              alt="Ekolo — Impact & finance verte"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent md:bg-gradient-to-r md:from-background/90 md:via-background/5 md:to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 md:right-auto flex items-center gap-3">
              <img
                src={ekoloLogo}
                alt="Logo Ekolo"
                className="w-14 h-14 rounded-xl shadow-lg bg-white/90 p-1.5"
              />
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">Ekolo</p>
                <p className="text-sm text-muted-foreground">{t("home.innovation.ekolo.tagline")}</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit mb-4">
              {t("home.innovation.badge")}
            </Badge>

            <p className="text-muted-foreground leading-relaxed mb-6">
              {t("home.innovation.ekolo.desc")}
            </p>

            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
              {ekoloFeatures.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 bg-gradient-tech rounded-lg flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(feature.title)}</p>
                    <p className="text-sm text-muted-foreground">{t(feature.desc)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button variant="nature" size="lg" className="group" asChild>
                <a href={EKOLO_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackOutboundClick('ekolo', EKOLO_URL)}>
                  {t("home.innovation.ekolo.cta")}
                  <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Button>
              <a
                href={EKOLO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutboundClick('ekolo', EKOLO_URL)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                ekolo.akouma.net
              </a>
            </div>

            <p className="text-xs text-muted-foreground mt-6 pt-6 border-t border-border/50">
              {t("home.innovation.ekolo.partner")}
            </p>
          </div>
        </div>

        {/* Nos projets — écran réduit : défilement horizontal (comme les actualités) ;
            desktop : grille paginée, toujours 3 cartes max sur une ligne */}
        {solutions.length > 0 && (
          <div className="relative mb-16">
            {/* Mobile : scroll horizontal sur l'ensemble des projets */}
            <div className="flex md:hidden overflow-x-auto pb-4 gap-6 snap-x snap-mandatory hide-scrollbar">
              {solutions.map((solution) => renderCard(solution, "min-w-[280px] sm:min-w-[320px] snap-center"))}
            </div>

            {/* Desktop : grille paginée */}
            <div className="hidden md:grid md:grid-cols-3 gap-8">
              {visibleSolutions.map((solution) => renderCard(solution, ""))}
            </div>

            {totalPages > 1 && (
              <div className="hidden md:flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Projets précédents"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  aria-label="Projets suivants"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
