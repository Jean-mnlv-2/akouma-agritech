import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Leaf, Star, Package, Truck, Shield, RefreshCw, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import DOMPurify from 'dompurify';
import TitleManager from "@/components/TitleManager";
import { useI18n } from "@/i18n";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import kilimoLogo from "@/assets/kilimo-logo.png";
import PageHeaderCarousel from "@/components/PageHeaderCarousel";

interface SeedProduct {
  id: number;
  slug: string;
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

interface RawSeedProduct {
  id: string | number;
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  variety?: string;
  price?: number | string;
  price_fcfa?: number | string;
  unit?: string;
  imageUrl?: string;
  image_url?: string;
  rating?: number | string;
  totalReviews?: number | string;
  total_reviews?: number | string;
  availability?: string;
  harvestTime?: string;
  harvest_time?: string;
  yield?: string;
  yield_info?: string;
  features?: string[];
}

const Seeds = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  const { t } = useI18n();

  const fetchSeeds = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/seeds', apiBaseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch seeds');
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Réponse invalide du serveur');
      }

      const body = await res.json();
      const data = (Array.isArray(body) ? body : body?.data) || [];
      
      const normalizedProducts: SeedProduct[] = (data || []).map((item: RawSeedProduct) => ({
        id: Number(item.id),
        slug: String(item.slug || item.id),
        name: String(item.name || ""),
        description: String(item.description || ""),
        category: String(item.category || ""),
        variety: String(item.variety || ""),
        price: Number(item.price) || Number(item.price_fcfa) || 0,
        unit: String(item.unit || ""),
        image: String(item.imageUrl || item.image_url || ""),
        rating: Number(item.rating) || 0,
        reviews: Number(item.totalReviews) || Number(item.total_reviews) || 0,
        availability: (item.availability || 'En stock') as 'En stock' | 'Rupture' | 'Pré-commande',
        harvestTime: String(item.harvestTime || item.harvest_time || ""),
        yield: String(item.yield || item.yield_info || ""),
        features: Array.isArray(item.features) ? item.features : [],
      }));

      const uniqueProducts = Array.from(new Map(normalizedProducts.map(p => [p.id, p])).values());
      setProducts(uniqueProducts);
    } catch (e) {
      console.error("Error fetching seeds:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const categories = useMemo(() => [
    { id: "all", name: t("seeds.cat.all") },
    { id: "cereales", name: t("seeds.cat.cereales") },
    { id: "legumineuses", name: t("seeds.cat.legumineuses") },
    { id: "legumes", name: t("seeds.cat.legumes") },
    { id: "fruits", name: t("seeds.cat.fruits") },
    { id: "fourrage", name: t("seeds.cat.fourrage") },
    { id: "aromates", name: t("seeds.cat.aromates") }
  ], [t]);

  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);

  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    return products.filter(product => {
      const matchesSearch = !searchLower || 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.variety.toLowerCase().includes(searchLower);
        
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CF', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t("seeds.meta.title")}
        description={t("seeds.meta.desc")}
        canonical={window.location.origin + '/seeds'}
        image={kilimoLogo}
      />
      <Header />
      
      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <PageHeaderCarousel
          pageKey="seeds"
          fallbackImage={kilimoLogo}
          fallbackAlt={t("seeds.hero.title")}
          overlayClassName="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-primary/30"
        />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              {t("seeds.hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed drop-shadow">
              {t("seeds.hero.desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-sm px-5 py-2.5 bg-green-100 text-green-800 border border-green-300 hover:scale-105 transition-transform">
                <Leaf className="w-4 h-4 mr-2" />
                {t("seeds.badge.certified")}
              </Badge>
              <Badge variant="secondary" className="text-sm px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:scale-105 transition-transform">
                <Package className="w-4 h-4 mr-2" />
                {t("seeds.badge.quality")}
              </Badge>
              <Badge variant="secondary" className="text-sm px-5 py-2.5 bg-accent/10 text-accent border border-accent/20 hover:scale-105 transition-transform">
                <Truck className="w-4 h-4 mr-2" />
                {t("seeds.badge.shipping")}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters - Enhanced */}
      <section className="py-10 bg-gradient-to-br from-card via-background to-muted/20 border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between max-w-6xl mx-auto">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("seeds.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select key="category-filter" value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64 h-12 border-2 focus:border-primary transition-all duration-300">
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

              { (searchQuery || selectedCategory !== "all") && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="text-muted-foreground hover:text-primary"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto mt-4 px-2">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length > 1 ? "produits trouvés" : "produit trouvé"}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div key="loading-seeds" className="text-center py-20">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">{t("seeds.loading")}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div key="seeds-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden">
                  <div className="relative overflow-hidden bg-muted/30 aspect-square flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Badge 
                      className={`absolute top-4 right-4 ${
                        product.availability === "En stock" ? "bg-green-500 text-white" :
                        product.availability === "Pré-commande" ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
                      } shadow-lg`}
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
                    <div 
                      className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[2.5rem]"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                    />
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
                          <Badge key={`${product.id}-feature-${index}-${feature.slice(0, 15)}`} variant="outline" className="text-xs">
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
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          disabled={product.availability === "Rupture"}
                          onClick={async () => {
                            await addToCart({
                              id: String(product.id),
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              inStock: product.availability !== "Rupture",
                            });
                            toast({ title: "Ajouté au panier", description: product.name });
                          }}
                          className="focus-visible:ring-4 focus-visible:ring-primary/40"
                          aria-label={`Ajouter ${product.name} au panier`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          disabled={product.availability === "Rupture"}
                          asChild
                          className="focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105"
                          aria-label={t("seeds.details.aria")}
                        >
                          <Link to={`/seeds/${product.slug}`}>
                            {t("seeds.details")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div key="no-seeds-found" className="text-center py-12">
               <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-xl font-semibold mb-2">{t("seeds.none")}</h3>
              <p className="text-muted-foreground">
                {t("seeds.try_adjust")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-background to-green-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Pourquoi Choisir Nos Semences ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des garanties de qualité et un accompagnement professionnel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="text-center p-8 group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Qualité Certifiée</h3>
              <p className="text-muted-foreground leading-relaxed">
                Toutes nos semences sont testées et certifiées pour garantir des rendements optimaux.
              </p>
            </Card>
            
            <Card className="text-center p-8 group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">Livraison Rapide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Livraison dans toute la région sous 48h pour préserver la viabilité des semences.
              </p>
            </Card>
            
            <Card className="text-center p-8 group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 transition-colors">Conseil Expert</h3>
              <p className="text-muted-foreground leading-relaxed">
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
