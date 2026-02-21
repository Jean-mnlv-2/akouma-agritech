import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, Star, Package, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContentSync } from '@/hooks/use-content-sync';
import { useI18n } from '@/i18n/i18n';
import DOMPurify from 'dompurify';

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

const SeedsSection = () => {
  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentIndex, setCurrentIndex] = useState(0);
  const { t } = useI18n();

  useContentSync({
    contentType: 'seeds',
    enabled: true,
    onUpdate: (data) => {
      const mapped = (data || []).map((item: unknown) => {
        const record = item as Record<string, unknown>;
        return {
        id: Number(record.id),
        name: String(record.name || ''),
        description: String(record.description || ''),
        category: String(record.category || ''),
        variety: String(record.variety || ''),
        price: Number(record.price_fcfa) || 0,
        unit: String(record.unit || ''),
        image: String(record.image_url || ''),
        rating: Number(record.rating) || 0,
        reviews: Number(record.total_reviews) || 0,
        availability: String(record.availability || 'En stock') as 'En stock' | 'Rupture' | 'Pré-commande',
        harvestTime: String(record.harvest_time || ''),
        yield: String(record.yield_info || ''),
        features: Array.isArray(record.features) ? (record.features as string[]) : [],
      };
      }) as SeedProduct[];
      setProducts(mapped.slice(0, 8));
      setLoading(false);
    }
  });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, products.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, products.length - 3)) % Math.max(1, products.length - 3));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CF', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.seeds.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('home.seeds.subtitle')}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse bg-muted h-64 w-full max-w-md rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-green-50/50 via-background to-primary/5 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            {t('home.seeds.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
            {t('home.seeds.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-green-100 text-green-800 border border-green-300">
              <Leaf className="w-4 h-4 mr-2" />
              {t('seeds.badge.certified')}
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border border-primary/20">
              <Package className="w-4 h-4 mr-2" />
              {t('seeds.badge.quality')}
            </Badge>
          </div>
          <div className="mt-6">
            <Button variant="outline" size="lg" asChild className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <Link to="/seeds">
                {t('home.seeds.view_all')}
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured Product - Large Card */}
        {products.length > 0 && (
          <div className="mb-12">
            <div className="relative bg-card rounded-2xl overflow-hidden shadow-natural group hover:shadow-xl transition-all duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto">
                  <img
                    src={products[0].image}
                    alt={products[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                    <Leaf className="w-3 h-3 mr-1" />
                    {t('seeds.badge.featured')}
                  </Badge>
                  <Badge 
                    className={`absolute top-4 right-4 ${
                      products[0].availability === "En stock" ? "bg-green-500" :
                      products[0].availability === "Pré-commande" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  >
                    {products[0].availability}
                  </Badge>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline">{products[0].category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {products[0].rating} ({products[0].reviews})
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {products[0].name}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(products[0].description) 
                      }} 
                    />
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <span className="font-medium text-foreground">{t('seeds.variety')}:</span>
                      <p className="text-muted-foreground">{products[0].variety}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t('seeds.harvest')}:</span>
                      <p className="text-muted-foreground">{products[0].harvestTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(products[0].price)}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('seeds.per')} {products[0].unit}</p>
                    </div>
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/seeds/${products[0].id}`}>
                        {t('seeds.details')}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Scroll Products */}
        {products.length > 1 && (
          <div className="relative">
            <div className="flex overflow-x-auto scrollbar-hide gap-6 pb-4" style={{ scrollSnapType: 'x mandatory' }}>
              {products.slice(1).map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-80"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
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
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-muted-foreground">({product.reviews})</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      <CardDescription className="text-sm line-clamp-2">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(product.description) 
                          }} 
                        />
                      </CardDescription>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{t('seeds.variety')}:</span>
                          <p className="text-muted-foreground text-xs">{product.variety}</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">{t('seeds.harvest')}:</span>
                          <p className="text-muted-foreground text-xs">{product.harvestTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('seeds.per')} {product.unit}</p>
                        </div>
                        <Button 
                          size="sm"
                          disabled={product.availability === "Rupture"}
                          asChild
                          className="focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105"
                        >
                          <Link to={`/seeds/${product.id}`}>
                            {t('seeds.details')}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {products.length > 4 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background/80 backdrop-blur-sm"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background/80 backdrop-blur-sm"
                  onClick={nextSlide}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link to="/seeds">
              {t('home.seeds.view_all')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SeedsSection;
