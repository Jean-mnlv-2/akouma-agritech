import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Truck, Shield, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import logoAk from "@/assets/logo-ak.png";

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
  specifications: { [key: string]: string };
  features: string[];
  gallery: string[];
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  // Fetch product data from backend
  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const url = new URL(`/api/shop_products/${id}`, apiBaseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch product');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Réponse invalide du serveur pour le produit');
      }
      const { data } = await res.json();
      
      setProduct({
        id: data.id,
        name: data.name,
        description: data.description,
        longDescription: data.longDescription || data.description,
        price: data.price || 0,
        originalPrice: data.originalPrice,
        image: data.imageUrl || logoAk,
        category: data.category || 'Général',
        rating: data.rating || 0,
        reviews: data.reviews || 0,
        inStock: data.isActive || false,
        isNew: data.isNew || false,
        isBestSeller: data.isBestSeller || false,
        specifications: data.specifications || {},
        features: data.features || [],
        gallery: data.gallery || [data.imageUrl || logoAk]
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // (mock data removed)

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
      <Header />
      
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
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img 
                src={product.gallery[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.gallery.map((image, index) => (
                <button
                  key={`${product.id}-gallery-${index}-${image}`}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.isNew && <Badge variant="secondary">Nouveau</Badge>}
                {product.isBestSeller && <Badge variant="destructive">Bestseller</Badge>}
                <Badge variant="outline">{product.category}</Badge>
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

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.longDescription}
              </p>
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
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                
                <Button variant="outline" size="icon">
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

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Caractéristiques</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={`${product.id}-feature-${index}-${feature.slice(0, 15)}`} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Spécifications techniques</h3>
              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
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
