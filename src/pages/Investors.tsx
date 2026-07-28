import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sprout, Globe2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Investors = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Investisseurs - KILIMO Agritech | Opportunités d'investissement"
        description="Découvrez les opportunités d'investissement chez KILIMO Agritech : agriculture intelligente, e-learning et impact social en Afrique."
        path={typeof window !== 'undefined' ? `${window.location.origin}/investors` : undefined}
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Investir dans l'agritech africaine</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            KILIMO accélère la transformation digitale de l'agriculture en Afrique grâce à la formation,
            aux semences certifiées et à l'agroconseil. Rejoignez-nous pour bâtir un avenir durable.
          </p>
        </header>

        <section aria-labelledby="why-invest" className="mb-12">
          <h2 id="why-invest" className="text-2xl font-bold mb-6">Pourquoi investir avec KILIMO</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Marché en croissance', desc: "L'agritech africaine pèse plusieurs milliards USD avec une demande en forte hausse." },
              { icon: Sprout, title: 'Impact mesurable', desc: 'Hausse documentée des rendements et des revenus des agriculteurs partenaires.' },
              { icon: Globe2, title: 'Présence panafricaine', desc: 'Opérations multi-pays, communauté multilingue et chaîne logistique optimisée.' },
            ].map(({ icon: Icon, title, desc }) => (
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