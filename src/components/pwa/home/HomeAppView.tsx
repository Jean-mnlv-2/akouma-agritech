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
import kilimoLogo from "@/assets/kilimo-logo.png";
import heroImage from "@/assets/hero-agritech.jpg?format=webp&quality=75";
import PageHeaderCarousel from "@/components/PageHeaderCarousel";

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

interface BoutiquePreviewItem {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  unit?: string;
  image: string;
}

const QUICK_ACTIONS = [
  { icon: GraduationCap, label: "E-Learning", to: "/elearning", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icon: ShoppingBag, label: "Boutique", to: "/boutique", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { icon: Newspaper, label: "Actualités", to: "/news", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { icon: Heart, label: "Faire un don", to: "/donations", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-CF", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(price);

export function HomeAppView() {
  const { t } = useI18n();
  const { data: stats } = usePublicStats();
  const [solutions, setSolutions] = useState<InnovativeSolution[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [seeds, setSeeds] = useState<BoutiquePreviewItem[]>([]);
  const [products, setProducts] = useState<BoutiquePreviewItem[]>([]);

  useEffect(() => {
    api.request("GET", "/api/innovative_solutions")
      .then((body: any) => setSolutions(((Array.isArray(body) ? body : body?.data) || []).slice(0, 6)))
      .catch(() => setSolutions([]));
    api.request("GET", "/api/news?is_published=true&pageSize=5")
      .then((body: any) => setNews(body?.data || []))
      .catch(() => setNews([]));
    api.request("GET", "/api/seeds")
      .then((body: any) => setSeeds(((Array.isArray(body) ? body : body?.data) || []).slice(0, 6).map((s: any) => ({
        id: s.id, slug: s.slug || String(s.id), name: s.name, price: Number(s.price) || 0,
        unit: s.unit || "kg", image: s.imageUrl || s.image_url || kilimoLogo,
      }))))
      .catch(() => setSeeds([]));
    api.request("GET", "/api/shop_products")
      .then((body: any) => setProducts(((Array.isArray(body) ? body : body?.data) || []).slice(0, 6).map((p: any) => ({
        id: p.id, slug: p.slug || String(p.id), name: p.name, price: Number(p.price ?? p.price_fcfa) || 0,
        image: p.imageUrl || p.image_url || kilimoLogo,
      }))))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="pb-8">
      {/* Hero compact — image + accroche, sans répéter le logo/nom KILIMO
          déjà affichés par le Header global */}
      <div className="px-4 pt-4">
        <div className="relative h-36 rounded-3xl overflow-hidden">
          <PageHeaderCarousel
            pageKey="home"
            fallbackImage={heroImage}
            fallbackAlt="KILIMO"
            intervalMs={5000}
            hideDots
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <h1 className="text-white text-lg font-bold leading-tight mb-0.5">
              L'agriculture intelligente, dans ta poche
            </h1>
            <p className="text-white/80 text-xs">Formations, semences certifiées & agroconseil</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-4 pt-4 pb-4">
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats — bandeau compact, une seule ligne */}
      {stats && (
        <div className="mx-4 mb-7 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-center justify-around text-center">
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalLearners}+</p>
            <p className="text-sm text-muted-foreground mt-1">Apprenants</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalCourses}</p>
            <p className="text-sm text-muted-foreground mt-1">Formations</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-base font-black text-primary leading-none">{stats.totalCertificates}</p>
            <p className="text-sm text-muted-foreground mt-1">Certificats</p>
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
            <p className="text-sm text-muted-foreground line-clamp-1">{t("home.innovation.ekolo.tagline")}</p>
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
                  <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
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
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Semences */}
      {seeds.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Semences</h2>
            <Link to="/boutique?type=semences" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x snap-mandatory hide-scrollbar">
            {seeds.map((s) => (
              <Link key={s.id} to={`/seeds/${s.slug}`} className="shrink-0 w-36 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="h-24 bg-muted/30 overflow-hidden">
                  <img src={s.image} alt={s.name} className="w-full h-full object-contain p-2" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold line-clamp-2 leading-snug mb-1">{s.name}</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(s.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Équipements */}
      {products.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Équipements</h2>
            <Link to="/boutique?type=equipements" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x snap-mandatory hide-scrollbar">
            {products.map((p) => (
              <Link key={p.id} to={`/shop/${p.slug}`} className="shrink-0 w-36 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="h-24 bg-muted/30 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-2" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold line-clamp-2 leading-snug mb-1">{p.name}</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomeAppView;
