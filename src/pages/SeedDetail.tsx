import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  Leaf, 
  Package, 
  Truck, 
  Shield,
  Clock,
  TrendingUp,
  ArrowLeft,
  Plus,
  Minus,
  Heart,
  Mail
} from "lucide-react";
import { useContactSettings } from "@/hooks/use-contact-settings";
import { useToast } from "@/hooks/use-toast";

interface SeedProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  variety: string;
  price: number;
  unit: string;
  images: string[];
  rating: number;
  reviews: number;
  availability: "En stock" | "Rupture" | "Pré-commande";
  harvestTime: string;
  yield: string;
  features: string[];
  fullDescription: string;
  specifications: {
    origin: string;
    purity: string;
    germination: string;
    moisture: string;
    packaging: string;
  };
  growingGuide: {
    soilType: string;
    plantingDepth: string;
    spacing: string;
    watering: string;
    fertilizer: string;
    diseases: string[];
  };
}

const SeedDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [product, setProduct] = useState<SeedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: contact } = useContactSettings();

  // Fetch product data from backend
  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/seeds/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch seed product');
      const { data } = await res.json();
      
      setProduct({
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category || 'Général',
        variety: data.variety || '',
        price: data.price || 0,
        unit: data.unit || 'kg',
        images: [data.imageUrl || '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png'],
        rating: data.rating || 0,
        reviews: data.reviews || 0,
        availability: data.availability || 'En stock',
        harvestTime: data.harvestTime || '120-140 jours',
        yield: data.yield || '8-12 tonnes/ha',
        features: data.features || [],
        fullDescription: data.fullDescription || data.description,
        specifications: {
          origin: data.origin || 'Local',
          purity: data.purity || '99%',
          germination: data.germination || '95%',
          moisture: data.moisture || '12%',
          packaging: data.packaging || 'Sachet 25kg'
        },
        growingGuide: {
          soilType: data.soilType || 'Sol bien drainé',
          plantingDepth: data.plantingDepth || '2-3 cm',
          spacing: data.spacing || '75x25 cm',
          watering: data.watering || 'Régulier',
          fertilizer: data.fertilizer || 'NPK équilibré',
          diseases: data.diseases || []
        }
      });
    } catch (error) {
      console.error('Error fetching seed product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // (mock data removed)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CF', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    toast({
      title: "Produit ajouté au panier",
      description: `${quantity} ${product.unit} de ${product.name} ajouté au panier.`,
    });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/seeds" className="hover:text-primary">Semences</Link>
          <span>/</span>
          <span className="text-foreground">{product?.name || 'Chargement...'}</span>
        </div>

        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/seeds">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux semences
          </Link>
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement du produit...</p>
            </div>
          </div>
        ) : !product ? (
          <div className="text-center py-12">
            <p>Produit non trouvé</p>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <Badge 
                className={`absolute top-4 right-4 ${
                  product.availability === "En stock" ? "bg-green-500" :
                  product.availability === "Pré-commande" ? "bg-yellow-500" : "bg-red-500"
                }`}
              >
                {product.availability}
              </Badge>
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{product.description}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews} avis)</span>
                </div>
                <Badge variant="secondary">{product.variety}</Badge>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
                    <p className="text-sm text-muted-foreground">par {product.unit}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={isFavorite ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-medium">Quantité:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={incrementQuantity}
                      className="h-10 w-10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                </div>

                {/* Total Price */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Ajouter au panier - Commenté pour le moment
                  <Button 
                    onClick={handleAddToCart}
                    disabled={product.availability === "Rupture"}
                    className="w-full h-12"
                    size="lg"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    {product.availability === "Pré-commande" ? "Pré-commander" : "Ajouter au panier"}
                  </Button>
                  */}
                  
                  <Button 
                    asChild
                    className="w-full h-12"
                    size="lg"
                  >
                    <Link to="/contact">
                      <Mail className="w-5 h-5 mr-2" />
                      Contactez-nous pour ce produit
                    </Link>
                  </Button>
                  
                  {/* Boutons CTA */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12" 
                      size="lg"
                      onClick={() => {
                        const phone = (contact?.whatsappNumber || contact?.phone || '').replace(/\D/g, '');
                        const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Bonjour, je suis intéressé par ' + product.name)}` : undefined;
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <span className="mr-2">💬</span>
                      WhatsApp
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-12" 
                      size="lg"
                      onClick={() => {
                        const tel = contact?.phone ? `tel:${contact.phone.replace(/\s/g, '')}` : undefined;
                        if (tel) window.open(tel, '_self');
                      }}
                    >
                      <span className="mr-2">📞</span>
                      Appeler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-medium text-sm">Temps de récolte</p>
                  <p className="text-xs text-muted-foreground">{product.harvestTime}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-medium text-sm">Rendement</p>
                  <p className="text-xs text-muted-foreground">{product.yield}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Spécifications</TabsTrigger>
              <TabsTrigger value="growing">Guide de culture</TabsTrigger>
              <TabsTrigger value="reviews">Avis ({product.reviews})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description détaillée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {product.fullDescription}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Shield className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Qualité garantie</p>
                        <p className="text-sm text-muted-foreground">Certifié et testé</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Truck className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Livraison rapide</p>
                        <p className="text-sm text-muted-foreground">48h partout</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Leaf className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Conseil expert</p>
                        <p className="text-sm text-muted-foreground">Support technique</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spécifications techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="growing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Guide de culture</CardTitle>
                  <CardDescription>
                    Conseils pour optimiser vos rendements avec cette variété
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(product.growingGuide).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="font-medium mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </h4>
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {value.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">{value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Avis clients</CardTitle>
                  <CardDescription>
                    Ce que pensent nos agriculteurs de ce produit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mock reviews */}
                    {[1, 2, 3].map((review) => (
                      <div key={review} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <span className="font-medium">Cultivateur#{review}</span>
                        </div>
                        <p className="text-muted-foreground">
                          Excellente variété, très bon rendement malgré la saison sèche. 
                          Je recommande vivement cette semence.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SeedDetail;