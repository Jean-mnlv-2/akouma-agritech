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
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
            alt={t('shop.hero.alt')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        </div>
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="text-green-400">{t('shop.hero.title1')}</span> {t('shop.hero.title2')}
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">{t('shop.hero.desc')}</p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Package className="w-4 h-4 mr-2" />
                {t('shop.badge.shipping')}
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Star className="w-4 h-4 mr-2" />
                {t('shop.badge.quality')}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {/* Filtres et recherche */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input placeholder={t('shop.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button key={category.id} variant={selectedCategory === category.id ? 'default' : 'outline'} onClick={() => setSelectedCategory(category.id)} size="sm" className="transition-all duration-200 hover:scale-105">{category.name}</Button>
              ))}
            </div>
            <div className="flex justify-center">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-input rounded-md bg-background text-foreground">
                {sortOptions.map((option) => (<option key={option.id} value={option.id}>{option.name}</option>))}
              </select>
            </div>
          </div>

          {/* Grille de produits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (<Badge className="bg-green-500 text-white text-xs">Nouveau</Badge>)}
                    {product.isBestseller && (<Badge className="bg-orange-500 text-white text-xs">Populaire</Badge>)}
                  </div>
                  <Badge className="absolute top-2 right-2">{product.category}</Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
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
                      <span className="text-xl font-bold text-primary">{product.price.toLocaleString()} FCFA</span>
                      {product.originalPrice > product.price && (<span className="text-sm text-muted-foreground line-through">{product.originalPrice.toLocaleString()} FCFA</span>)}
                    </div>
                  </div>
                  <Button onClick={() => handleAddToCart(product)} className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('shop.add_to_cart')}
                  </Button>
                </CardContent>
              </Card>
            ))}
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