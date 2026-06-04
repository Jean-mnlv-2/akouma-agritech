import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Truck, Shield, Award, CheckCircle, Settings } from "lucide-react";
import DOMPurify from 'dompurify';
import { useCopyProtection } from "@/hooks/use-copy-protection";
import CopyProtectionDialog from "@/components/CopyProtectionDialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import kilimoLogo from "@/assets/kilimo-logo.png";
import { useNavigate } from "react-router-dom";
import TitleManager from "@/components/TitleManager";

interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isCopyProtected: boolean;
  specifications: { [key: string]: string };
  features: string[];
  gallery: string[];
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  const { isDialogOpen, closeDialog } = useCopyProtection(
    !!product?.isCopyProtected,
    {
      title: product?.name || "",
      imageUrl: product?.image,
      excerpt: product?.description,
      url: window.location.href,
    }
  );

  const isLoggedIn = Boolean(sessionStorage.getItem('kilimo_auth_user'));

  // Fetch product data from backend
  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const url = new URL(`/api/shop_products/slug/${slug}`, apiBaseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch product');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Réponse invalide du serveur pour le produit');
      }
      const { data } = await res.json();
      
      const specs = typeof data.specifications === 'string' 
        ? JSON.parse(data.specifications) 
        : (data.specifications || {});

      let gallery = [data.imageUrl || kilimoLogo];
      if (Array.isArray(data.gallery) && data.gallery.length > 0) {
        gallery = data.gallery;
      } else if (typeof data.gallery === 'string') {
        try {
          const parsed = JSON.parse(data.gallery);
          if (Array.isArray(parsed) && parsed.length > 0) gallery = parsed;
        } catch {
          const split = data.gallery.split(',').map((u: string) => u.trim()).filter(Boolean);
          if (split.length > 0) gallery = split;
        }
      }

      if (data.imageUrl && !gallery.includes(data.imageUrl)) {
        gallery = [data.imageUrl, ...gallery];
      }

      setProduct({
        id: data.id,
        name: data.name,
        description: data.description,
        longDescription: data.longDescription || data.description,
        price: data.price || 0,
        originalPrice: data.originalPrice,
        image: data.imageUrl || kilimoLogo,
        category: data.category || 'Général',
        rating: data.rating || 0,
        reviews: data.reviews || 0,
        inStock: data.isActive || false,
        isNew: data.isNew || false,
        isBestSeller: data.isBestSeller || false,
        isCopyProtected: !!(data.isCopyProtected || data.is_copy_protected),
        specifications: specs,
        features: Array.isArray(data.features) ? data.features : (typeof data.features === 'string' ? data.features.split(',').map((f: string) => f.trim()).filter(Boolean) : []),
        gallery: gallery
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug, apiBaseUrl]);

  // (mock data removed)

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    if (product) {
      // Add multiple items based on quantity
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          inStock: product.inStock
        });
      }
      
      toast({
        title: "Produit ajouté au panier",
        description: `${quantity}x ${product.name} ajouté avec succès`,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    const shareData = {
      title: product?.name || "KILIMO Agritech",
      text: `Découvrez ${product?.name} sur KILIMO Agritech : ${product?.description?.replace(/<[^>]*>/g, '').slice(0, 100)}...`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        setIsSharing(true);
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien du produit a été copié dans votre presse-papier.",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Produit introuvable</h1>
          <Link to="/shop" className="text-primary hover:underline">
            Retour à la boutique
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <TitleManager
          title={product.name}
          description={product.description.replace(/<[^>]*>/g, '')}
          image={product.image}
          ogType="product"
          jsonLd={[
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.name,
              "description": product.description.replace(/<[^>]*>/g, ''),
              "image": product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`,
              "brand": { "@type": "Organization", "name": "KILIMO" },
              "offers": {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "XOF",
                "price": product.price,
                "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              },
              "aggregateRating": product.rating > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviews
              } : undefined
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Accueil", item: window.location.origin + "/" },
                { "@type": "ListItem", position: 2, name: "Boutique", item: window.location.origin + "/shop" },
                { "@type": "ListItem", position: 3, name: product.name, item: window.location.href },
              ],
            },
          ]}
        />
      )}
      <Header />
      
      {product && (
        <CopyProtectionDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          item={{
            title: product.name,
            imageUrl: product.image,
            excerpt: product.description,
            url: window.location.href,
          }}
        />
      )}

      <div className="container mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary">Boutique</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Back button */}
        <Link to="/shop" className="inline-flex items-center text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la boutique
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden border-2 border-border flex items-center justify-center relative group">
              <img 
                src={product.gallery[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.gallery.map((image, index) => (
                <button
                  key={`${product.id}-gallery-${index}-${image}`}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-muted/30 rounded-lg overflow-hidden border-2 flex items-center justify-center transition-all ${
                    selectedImage === index ? 'border-primary shadow-md scale-105' : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {product.isNew && <Badge variant="secondary">Nouveau</Badge>}
                  {product.isBestSeller && <Badge variant="destructive">Bestseller</Badge>}
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Partager
                </Button>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => {
                    const starKey = `product-${product.id}-star-${i}`;
                    return (
                    <Star 
                      key={starKey} 
                      className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  )})}
                  <span className="text-sm text-muted-foreground ml-2">
                    {product.rating} ({product.reviews} avis)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div 
                className="text-muted-foreground leading-relaxed mb-6 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.longDescription) }}
              />
            </div>

            {/* Quantity and actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantité:</label>
                <div className="flex items-center border rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-muted"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.inStock ? 'Ajouter au panier' : 'Rupture de stock'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (!isLoggedIn) {
                      toast({
                        title: "Authentification requise",
                        description: "Veuillez vous connecter pour ajouter ce produit à vos favoris.",
                      });
                      navigate('/auth');
                      return;
                    }
                    setIsFavorite(!isFavorite);
                    toast({
                      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
                      description: isFavorite ? "Le produit a été retiré de votre liste." : "Le produit a été ajouté à votre liste de favoris.",
                    });
                  }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Livraison gratuite</div>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Garantie 2 ans</div>
              </div>
              <div className="text-center">
                <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Support technique</div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations Détaillées */}
        <div className="mt-16 mb-8">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="w-8 h-1 bg-primary rounded-full"></span>
            Informations détaillées
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors duration-300">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Caractéristiques</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <li 
                    key={`${product.id}-feature-${index}-${feature.slice(0, 15)}`} 
                    className="flex items-start text-sm p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group"
                  >
                    <div className="mt-1 w-2 h-2 bg-primary rounded-full mr-3 shrink-0 group-hover:scale-125 transition-transform"></div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {feature.replace(/<[^>]*>/g, '')}
                    </span>
                  </li>
                ))}
                {product.features.length === 0 && (
                  <li className="text-sm text-muted-foreground italic">Aucune caractéristique spécifiée</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors duration-300">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Spécifications techniques</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <span className="text-sm font-medium text-muted-foreground">{key}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {String(value).replace(/<[^>]*>/g, '')}
                    </span>
                  </div>
                ))}
                {Object.keys(product.specifications).length === 0 && (
                  <div className="text-sm text-muted-foreground italic text-center py-4">Aucune spécification technique disponible</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
