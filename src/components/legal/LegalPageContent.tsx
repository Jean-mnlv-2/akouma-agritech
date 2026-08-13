import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import type { LucideIcon } from "lucide-react";
import { FileQuestion } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";

interface LegalPage {
  id: number;
  title: string;
  content: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  effectiveDate?: string | null;
  version?: string | null;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

const OTHER_LEGAL_LINKS = [
  { slug: "privacy", label: "Politique de confidentialité", href: "/privacy" },
  { slug: "terms", label: "Conditions d'utilisation", href: "/terms" },
  { slug: "legal", label: "Mentions légales", href: "/legal" },
];

interface LegalPageContentProps {
  slug: "privacy" | "terms" | "legal";
  icon: LucideIcon;
  fallbackTitle: string;
  subtitle: string;
  seoDescription: string;
  loadingText: string;
}

export function LegalPageContent({ slug, icon: Icon, fallbackTitle, subtitle, seoDescription, loadingText }: LegalPageContentProps) {
  const isStandalone = useStandalonePwa();
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPage = async () => {
      try {
        const url = new URL(`/api/legal_pages?slug=${slug}`, apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to fetch legal page (${slug})`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Réponse invalide du serveur pour cette page légale");
        }
        const { data } = await res.json();
        if (!cancelled && data && data.length > 0) setPage(data[0]);
      } catch (error) {
        console.error(`Error fetching legal page (${slug}):`, error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchPage();
    return () => { cancelled = true; };
  }, [slug]);

  if (isLoading) {
    return <LoadingSpinner size="large" text={loadingText} />;
  }

  const lastUpdated = page?.effectiveDate || page?.updatedAt;

  const seo = (
    <SEO
      title={page?.title || fallbackTitle}
      description={seoDescription}
      path={window.location.origin + `/${slug}`}
      image="/kilimo-logo.png"
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <AppPageHeader title={page?.title || fallbackTitle} backTo="/menu" subtitle={subtitle} />
        <div className="px-4 pt-4 pb-8 space-y-5">
          {lastUpdated && (
            <Badge variant="outline" className="text-xs font-normal">
              Mise à jour : {new Date(lastUpdated).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
              {page?.version ? ` · v${page.version}` : ""}
            </Badge>
          )}
          {page ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:text-foreground
                prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 first:prose-h2:mt-0
                prose-p:text-foreground/85 prose-p:leading-relaxed
                prose-li:text-foreground/85 prose-strong:text-foreground
                prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileQuestion className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cette page n'est pas encore disponible. Contactez-nous si vous avez besoin de cette information.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground pt-2 border-t border-border">
            <span className="w-full text-xs text-muted-foreground/70 uppercase tracking-wide mb-1">Voir aussi</span>
            {OTHER_LEGAL_LINKS.filter((l) => l.slug !== slug).map((l) => (
              <Link key={l.slug} to={l.href} className="text-primary hover:underline">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />

      {/* En-tête */}
      <section className="relative pt-16 pb-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {page?.title || fallbackTitle}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              {subtitle}
            </p>
            {lastUpdated && (
              <Badge variant="outline" className="text-xs font-normal">
                Dernière mise à jour : {new Date(lastUpdated).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                {page?.version ? ` · v${page.version}` : ""}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            {page ? (
              <Card className="shadow-sm">
                <CardContent className="p-6 md:p-10">
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none
                      prose-headings:font-semibold prose-headings:text-foreground prose-headings:scroll-mt-24
                      prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 first:prose-h2:mt-0
                      prose-p:text-muted-foreground prose-p:leading-relaxed
                      prose-li:text-muted-foreground prose-strong:text-foreground
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <FileQuestion className="w-10 h-10 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Cette page n'est pas encore disponible. Contactez-nous si vous avez besoin de cette information.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Navigation croisée vers les autres pages légales */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Voir aussi :</span>
              {OTHER_LEGAL_LINKS.filter((l) => l.slug !== slug).map((l, i, arr) => (
                <span key={l.slug}>
                  <Link to={l.href} className="text-primary hover:underline">{l.label}</Link>
                  {i < arr.length - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
