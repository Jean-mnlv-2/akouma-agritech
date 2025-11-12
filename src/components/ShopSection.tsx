import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Package, ChevronLeft, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContentSync } from '@/hooks/use-content-sync';
import { useI18n } from '@/i18n/i18n';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  inStock: boolean;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  reviews: number;
}

const ShopSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useI18n();

  // Utiliser le hook de synchronisation pour les produits
  useContentSync({
    contentType: 'shop_products',
    onUpdate: (data) => {
      const normalizedProducts = (data as unknown[]).map((item) => {
        const record = item as Record<string, unknown>;
        return {
          id: record.id as string,
          name: record.name as string,
          description: record.description as string,
          price: (record.price_fcfa as number) || 0,
          originalPrice: (record.original_price_fcfa as number) || 0,
          image: (record.image_url as string) || '/placeholder.svg',
          category: (record.category as string) || 'Général',
          inStock: (record.in_stock as boolean) || false,
          isNew: (record.is_new as boolean) || false,
          isBestseller: (record.is_bestseller as boolean) || false,
          rating: (record.rating as number) || 0,
          reviews: (record.reviews_count as number) || 0,
        };
      });
      setProducts(normalizedProducts.slice(0, 8)); // Limiter à 8 produits
      setLoading(false);
    },
    enabled: true,
  });

  // Fallback: arrêter le loading après 5 secondes si aucune donnée
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.log('ShopSection: Timeout fallback - no data received');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

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
      <section className="py-16 bg-gradient-to-br from-blue-50 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.shop.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('home.shop.subtitle')}
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
    <section className="py-16 bg-gradient-to-br from-blue-50 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('home.shop.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.shop.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Package className="w-4 h-4 mr-2" />
              {t('shop.badge.shipping')}
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              {t('shop.badge.quality')}
            </Badge>
          </div>
          <div className="mt-4">
            <Button variant="link" asChild>
              <Link to="/shop">Voir plus...</Link>
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
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {products[0].isNew && (
                      <Badge className="bg-green-500 text-white">
                        Nouveau
                      </Badge>
                    )}
                    {products[0].isBestseller && (
                      <Badge className="bg-orange-500 text-white">
                        <Zap className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <Badge className="absolute top-4 right-4">
                    {products[0].category}
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
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {products[0].description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(products[0].price)}
                      </span>
                      {products[0].originalPrice > products[0].price && (
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(products[0].originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/shop/${products[0].id}`}>
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {t('shop.add_to_cart')}
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
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isNew && (
                          <Badge className="bg-green-500 text-white text-xs">
                            Nouveau
                          </Badge>
                        )}
                        {product.isBestseller && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Populaire
                          </Badge>
                        )}
                      </div>
                      <Badge className="absolute top-2 right-2">
                        {product.category}
                      </Badge>
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive">Rupture de stock</Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-muted-foreground">({product.reviews})</span>
                        </div>
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        disabled={!product.inStock}
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                        asChild
                      >
                        <Link to={`/shop/${product.id}`}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {product.inStock ? t('shop.add_to_cart') : t('shop.out_of_stock')}
                        </Link>
                      </Button>
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
            <Link to="/shop">
              {t('home.shop.view_all')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ShopSection;
