import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Package, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContentSync } from '@/hooks/use-content-sync';
import { useI18n } from '@/i18n/i18n';

interface Product {
  id: string;
  slug: string;
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
  const [_currentIndex, _setCurrentIndex] = useState(0);
  const { t } = useI18n();

  // Utiliser le hook de synchronisation pour les produits
  useContentSync({
    contentType: 'shop_products',
    onUpdate: (data) => {
      const rawItems = (data as Record<string, any>[]) || [];
      const publishedItems = rawItems.filter(item => item.isPublished || item.is_published);

      const normalizedProducts = publishedItems.map((record) => {
        return {
          id: String(record.id),
          slug: (record.slug as string) || String(record.id),
          name: record.name as string,
          description: record.description as string,
          price: Number(record.price ?? record.price_fcfa ?? 0),
          originalPrice: Number(record.original_price_fcfa || record.originalPrice || 0),
          image: (record.imageUrl as string || record.image_url as string) || '/placeholder.svg',
          category: (record.category as string) || 'Général',
          inStock: !!(record.isActive ?? record.inStock ?? record.in_stock),
          isNew: !!(record.isNew || record.is_new),
          isFeatured: !!(record.isFeatured || record.is_featured),
          isBestseller: !!(record.isBestseller || record.is_bestseller),
          rating: Number(record.rating) || 0,
          reviews: Number(record.reviews_count || record.totalReviews || 0),
          createdAt: record.createdAt || record.created_at,
        };
      });

      const sortedProducts = [...normalizedProducts].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setProducts(sortedProducts.slice(0, 8));
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
    <section className="py-20 bg-gradient-to-br from-blue-50/50 via-background to-accent/5 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('home.shop.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
            {t('home.shop.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300">
              <Package className="w-4 h-4 mr-2" />
              {t('shop.badge.shipping')}
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-accent/10 text-accent border border-accent/20">
              <Star className="w-4 h-4 mr-2" />
              {t('shop.badge.quality')}
            </Badge>
          </div>
          <div className="mt-6">
            <Button variant="outline" size="lg" asChild className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <Link to="/shop">
                {t('home.shop.view_all')}
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
                <div className="relative h-64 md:h-auto bg-muted/30 flex items-center justify-center">
                  <img
                    src={products[0].image}
                    alt={products[0].name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
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
                    {products[0].description?.replace(/<[^>]*>/g, '').trim()}
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
                      <Link to={`/shop/${products[0].slug}`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.slice(1).map((product, index) => {
              const delay = index * 50;
              return (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="relative overflow-hidden bg-muted/30 aspect-square flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && (
                        <Badge className="bg-green-500 text-white text-xs shadow-lg">Nouveau</Badge>
                      )}
                      {product.isBestseller && (
                        <Badge className="bg-orange-500 text-white text-xs shadow-lg">
                          <Zap className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm shadow-lg text-foreground border-border/50">{product.category}</Badge>
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Rupture de stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-2">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm min-h-[40px]">{product.description?.replace(/<[^>]*>/g, '').trim()}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">({product.reviews})</span>
                      </div>
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={!product.inStock}
                        className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        asChild
                      >
                        <Link to={`/shop/${product.slug}`}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {product.inStock ? t('shop.add_to_cart') : t('shop.out_of_stock')}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="px-3">
                        <Link to={`/shop/${product.slug}`}>
                          Détails
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
