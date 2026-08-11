import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, ShoppingBag, Newspaper, Heart, ArrowRight, ExternalLink,
  Lightbulb, Droplets, BoxSelect, ScanSearch, Leaf, Cpu, Smartphone, Zap,
  CloudRain, BarChart3, Sprout, Bug, Microscope, Calendar,
} from "lucide-react";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n";
import { usePublicStats } from "@/hooks/use-public-stats";
import ekoloLogo from "@/assets/ekolo-logo.png";

const ICONS: Record<string, typeof Lightbulb> = {
  Droplets, BoxSelect, ScanSearch, Leaf, Cpu, Smartphone, Zap, CloudRain, BarChart3, Sprout, Bug, Microscope,
};

interface InnovativeSolution {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon?: string;
}

interface NewsItem {
  id: number;
  slug: string;
  title: string;
  imageUrl?: string;
  createdAt: string;
  category?: string;
}

const QUICK_ACTIONS = [
  { icon: GraduationCap, label: "E-Learning", to: "/elearning", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icon: ShoppingBag, label: "Boutique", to: "/boutique", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { icon: Newspaper, label: "Actualités", to: "/news", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { icon: Heart, label: "Faire un don", to: "/donations", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
];

export function HomeAppView() {
  const { t } = useI18n();
  const { data: stats } = usePublicStats();
  const [solutions, setSolutions] = useState<InnovativeSolution[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    api.request("GET", "/api/innovative_solutions")
      .then((body: any) => setSolutions(((Array.isArray(body) ? body : body?.data) || []).slice(0, 6)))
      .catch(() => setSolutions([]));
    api.request("GET", "/api/news?is_published=true&pageSize=5")
      .then((body: any) => setNews(body?.data || []))
      .catch(() => setNews([]));
  }, []);

  return (
    <div className="pb-8">
      {/* Header compact — remplace le hero plein écran */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <img src="/kilimo-logo.png" alt="KILIMO" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-bold leading-tight">KILIMO</h1>
            <p className="text-xs text-muted-foreground">L'agriculture intelligente, dans ta poche</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats — bandeau compact, une seule ligne */}
      {stats && (
        <div className="mx-4 mb-7 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-center justify-around text-center">
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalLearners}+</p>
            <p className="text-[10px] text-muted-foreground mt-1">Apprenants</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalCourses}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Formations</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalCertificates}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Certificats</p>
          </div>
        </div>
      )}

      {/* Ekolo — partenaire */}
      <div className="px-4 mb-7">
        <a
          href="https://ekolo.akouma.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 active:bg-muted/60 transition-colors"
        >
          <img src={ekoloLogo} alt="Ekolo" className="w-11 h-11 rounded-xl bg-white/90 p-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Ekolo</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{t("home.innovation.ekolo.tagline")}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
        </a>
      </div>

      {/* Nos solutions innovantes */}
      {solutions.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Nos solutions</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-0 px-4 snap-x snap-mandatory hide-scrollbar">
            {solutions.map((s) => {
              const Icon = (s.icon && ICONS[s.icon]) || Lightbulb;
              return (
                <div key={s.id} className="shrink-0 w-64 snap-start rounded-2xl border border-border/60 bg-card p-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-tech flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 line-clamp-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{s.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Actualités */}
      {news.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Actualités</h2>
            <Link to="/news" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x snap-mandatory hide-scrollbar">
            {news.map((n) => (
              <Link key={n.id} to={`/news/${n.slug}`} className="shrink-0 w-52 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="h-28 bg-muted overflow-hidden">
                  {n.imageUrl && <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2 leading-snug mb-1.5">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Boutique — bannière teaser */}
      <div className="px-4">
        <Link
          to="/boutique"
          className="block rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground relative overflow-hidden"
        >
          <ShoppingBag className="absolute -right-3 -bottom-3 w-24 h-24 opacity-15" />
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Boutique unifiée</p>
          <h3 className="text-lg font-black mb-1">Semences & équipements</h3>
          <p className="text-sm opacity-90 mb-3">Tout ce qu'il faut pour ton exploitation, au même endroit.</p>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            Découvrir <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

export default HomeAppView;
