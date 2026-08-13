import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sprout, Globe2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";

const REASONS = [
  { icon: TrendingUp, title: 'Marché en croissance', desc: "L'agritech africaine pèse plusieurs milliards USD avec une demande en forte hausse." },
  { icon: Sprout, title: 'Impact mesurable', desc: 'Hausse documentée des rendements et des revenus des agriculteurs partenaires.' },
  { icon: Globe2, title: 'Présence panafricaine', desc: 'Opérations multi-pays, communauté multilingue et chaîne logistique optimisée.' },
];

const Investors = () => {
  const isStandalone = useStandalonePwa();

  const seo = (
    <SEO
      title="Investisseurs - KILIMO Agritech | Opportunités d'investissement"
      description="Découvrez les opportunités d'investissement chez KILIMO Agritech : agriculture intelligente, e-learning et impact social en Afrique."
      path={typeof window !== 'undefined' ? `${window.location.origin}/investors` : undefined}
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <AppPageHeader title="Investisseurs" backTo="/menu" subtitle="Investir dans l'agritech africaine" />
        <div className="px-4 pt-4 pb-8 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            KILIMO accélère la transformation digitale de l'agriculture en Afrique grâce à la formation, aux
            semences certifiées et à l'agroconseil. Rejoignez-nous pour bâtir un avenir durable.
          </p>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Pourquoi investir</h2>
            <div className="space-y-2.5">
              {REASONS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border/60 p-3.5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
            <h2 className="text-base font-bold mb-1.5">Demander notre deck investisseur</h2>
            <p className="text-sm text-muted-foreground mb-4">Contactez l'équipe pour recevoir le dossier complet sous NDA.</p>
            <Button asChild className="w-full">
              <Link to="/contact"><Mail className="w-4 h-4 mr-2" /> Contacter l'équipe</Link>
            </Button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-4">Investir dans l'agritech africaine</h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            KILIMO accélère la transformation digitale de l'agriculture en Afrique grâce à la formation,
            aux semences certifiées et à l'agroconseil. Rejoignez-nous pour bâtir un avenir durable.
          </p>
        </header>

        <section aria-labelledby="why-invest" className="mb-12">
          <h2 id="why-invest" className="text-2xl font-bold mb-6">Pourquoi investir avec KILIMO</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {REASONS.map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="get-deck" className="text-center">
          <h2 id="get-deck" className="text-2xl font-bold mb-3">Demander notre deck investisseur</h2>
          <p className="text-muted-foreground mb-6">Contactez l'équipe pour recevoir le dossier complet sous NDA.</p>
          <Button asChild size="lg">
            <Link to="/contact"><Mail className="w-4 h-4 mr-2" /> Contacter l'équipe</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Investors;