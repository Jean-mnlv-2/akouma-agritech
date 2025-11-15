import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ShoppingCart, Star, Tag, Package } from 'lucide-react';
import TitleManager from '@/components/TitleManager';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/i18n/i18n';
import { useCartContext } from '@/context/CartContext';

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

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const { toast } = useToast();
  const { t } = useI18n();
  const { addToCart } = useCartContext();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/shop_products', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load products');
        const body = await res.json();
        const items = Array.isArray(body) ? body : body.data;
        const normalized = (items || []).map((item: any) => ({
          id: String(item.id),
          name: item.name ?? '',
          description: item.description ?? '',
          price: Number(item.price ?? item.price_fcfa ?? 0),
          originalPrice: Number(item.originalPrice ?? item.original_price_fcfa ?? 0),
          image: item.imageUrl ?? item.image_url ?? '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png',
          category: item.category ?? 'Général',
          inStock: Boolean(item.isActive ?? item.in_stock ?? false),
          isNew: Boolean(item.isNew ?? item.is_new ?? false),
          isBestseller: Boolean(item.isBestSeller ?? item.is_bestseller ?? false),
          rating: Number(item.rating ?? 0),
          reviews: Number(item.reviews ?? item.reviews_count ?? 0),
        }));
        setProducts(normalized);
      } catch (e) {
        console.error('Error fetching products:', e);
        toast({ title: t('common.error'), description: t('shop.load_error'), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [toast, t]);

  const categories = [
    { id: 'all', name: t('shop.cat.all') },
    { id: 'semences', name: t('shop.cat.seeds') },
    { id: 'engrais', name: t('shop.cat.fertilizers') },
    { id: 'outils', name: t('shop.cat.tools') },
    { id: 'technologies', name: t('shop.cat.tech') }
  ];

  const sortOptions = [
    { id: 'name', name: t('shop.sort.name') },
    { id: 'price-low', name: t('shop.sort.price_low') },
    { id: 'price-high', name: t('shop.sort.price_high') },
    { id: 'rating', name: t('shop.sort.rating') },
    { id: 'newest', name: t('shop.sort.newest') }
  ];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return 0;
        default:
          return 0;
      }
    });

  const handleAddToCart = (product: Product) => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, inStock: product.inStock });
    toast({ title: t('shop.added'), description: `${product.name} ${t('shop.added_desc')}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TitleManager
          title={t('shop.meta.title')}
          description={t('shop.meta.desc')}
          image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
        />
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] page-with-header">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t('shop.meta.title')}
        description={t('shop.meta.desc')}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      {/* Hero Section - Modern Design */}
      <section className="relative pt-24 pb-20 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
            alt={t('shop.hero.alt')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"></div>
          {/* Animated background decorations */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border border-primary/30 hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Boutique Agricole
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('shop.hero.title1')}</span> {t('shop.hero.title2')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">{t('shop.hero.desc')}</p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:scale-105 transition-transform">
                <Package className="w-4 h-4 mr-2" />
                {t('shop.badge.shipping')}
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 backdrop-blur-sm text-green-300 border-2 border-green-500/30 hover:scale-105 transition-transform">
                <Star className="w-4 h-4 mr-2" />
                {t('shop.badge.quality')}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - Enhanced */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {/* Filtres et recherche - Enhanced */}
          <div className="mb-12 space-y-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder={t('shop.search')} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-12 h-12 text-base border-2 focus:border-primary transition-colors" 
              />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button 
                  key={category.id} 
                  variant={selectedCategory === category.id ? 'default' : 'outline'} 
                  onClick={() => setSelectedCategory(category.id)} 
                  size="sm" 
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <div className="flex justify-center">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-4 py-2.5 border-2 border-input rounded-md bg-background text-foreground focus:border-primary transition-colors"
              >
                {sortOptions.map((option) => (<option key={option.id} value={option.id}>{option.name}</option>))}
              </select>
            </div>
          </div>

          {/* Grille de produits - Enhanced */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product, index) => {
              const delay = index * 50;
              return (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && (
                        <Badge className="bg-green-500 text-white text-xs shadow-lg">Nouveau</Badge>
                      )}
                      {product.isBestseller && (
                        <Badge className="bg-orange-500 text-white text-xs shadow-lg">Populaire</Badge>
                      )}
                    </div>
                    <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm shadow-lg">{product.category}</Badge>
                  </div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 relative z-10">
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
                        <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()} FCFA</span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">{product.originalPrice.toLocaleString()} FCFA</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(product)} 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('shop.add_to_cart')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('shop.none')}</h3>
              <p className="text-muted-foreground">{t('shop.try_adjust')}</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}