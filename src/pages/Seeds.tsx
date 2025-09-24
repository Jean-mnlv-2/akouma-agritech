import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Leaf, Star, Package, Truck, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/integrations/api/client";
import DOMPurify from 'dompurify';
import TitleManager from "@/components/TitleManager";
import { useI18n } from "@/i18n/i18n";

interface SeedProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  variety: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  reviews: number;
  availability: "En stock" | "Rupture" | "Pré-commande";
  harvestTime: string;
  yield: string;
  features: string[];
}

const Seeds = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "Toutes catégories" },
    { id: "cereales", name: "Céréales" },
    { id: "legumineuses", name: "Légumineuses" },
    { id: "legumes", name: "Légumes" },
    { id: "fruits", name: "Fruits" },
    { id: "fourrage", name: "Plantes fourragères" },
    { id: "aromates", name: "Herbes & Aromates" }
  ];

  useEffect(() => {
    const fetchSeeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/seeds');
        if (!res.ok) throw new Error('Failed to fetch seeds');
        const body = await res.json();
        const data = (Array.isArray(body) ? body : body?.data) || [];
        setProducts((data || []).map((item: Record<string, unknown>) => ({
          id: Number(item.id),
          name: String(item.name),
          description: String(item.description),
          category: String(item.category),
          variety: String(item.variety),
          price: Number((item as any).price_fcfa) || 0,
          unit: String((item as any).unit || ''),
          image: String((item as any).image_url || ''),
          rating: Number((item as any).rating) || 0,
          reviews: Number((item as any).total_reviews) || 0,
          availability: String((item as any).availability || 'En stock') as 'En stock' | 'Rupture' | 'Pré-commande',
          harvestTime: String((item as any).harvest_time || ''),
          yield: String((item as any).yield_info || ''),
          features: Array.isArray((item as any).features) ? (item as any).features as string[] : [],
        })));
      } catch (e) {
        setError("Erreur lors du chargement des semences.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSeeds();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CF', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t("seeds.meta.title")}
        description={t("seeds.meta.desc")}
        canonical={window.location.origin + '/seeds'}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-r from-primary/5 to-secondary/5 mobile-page-content">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {t("seeds.hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("seeds.hero.desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Leaf className="w-4 h-4 mr-2" />
                {t("seeds.badge.certified")}
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Package className="w-4 h-4 mr-2" />
                {t("seeds.badge.quality")}
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Truck className="w-4 h-4 mr-2" />
                {t("seeds.badge.shipping")}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("seeds.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder={t("seeds.select_category")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="text-center py-12">{t("seeds.loading")}</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge 
                      className={`absolute top-3 right-3 ${
                        product.availability === "En stock" ? "bg-green-500" :
                        product.availability === "Pré-commande" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                    >
                      {product.availability}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">({product.reviews})</span>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} />
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{t("seeds.variety")}:</span>
                        <p className="text-muted-foreground">{product.variety}</p>
                      </div>
                      <div>
                        <span className="font-medium">{t("seeds.harvest")}:</span>
                        <p className="text-muted-foreground">{product.harvestTime}</p>
                      </div>
                      <div>
                        <span className="font-medium">{t("seeds.yield")}:</span>
                        <p className="text-muted-foreground">{product.yield}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium text-sm">{t("seeds.features")}:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.features.slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {product.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.features.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>
                        <p className="text-sm text-muted-foreground">{t("seeds.per")} {product.unit}</p>
                      </div>
                      <Button 
                        size="sm"
                        disabled={product.availability === "Rupture"}
                        asChild
                        className="focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105"
                        aria-label={t("seeds.details.aria")}
                      >
                        <Link to={`/seeds/${product.id}`}>
                          {t("seeds.details")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("seeds.none")}</h3>
              <p className="text-muted-foreground">
                {t("seeds.try_adjust")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Qualité Certifiée</h3>
              <p className="text-muted-foreground">
                Toutes nos semences sont testées et certifiées pour garantir des rendements optimaux.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Livraison Rapide</h3>
              <p className="text-muted-foreground">
                Livraison dans toute la région sous 48h pour préserver la viabilité des semences.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conseil Expert</h3>
              <p className="text-muted-foreground">
                Nos agronomes vous accompagnent dans le choix des variétés adaptées à votre région.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Seeds;