import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Star, 
  MessageSquare, 
  Phone, 
  ArrowLeft, 
  CheckCircle2, 
  ClipboardList, 
  Sprout, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Waves, 
  TrendingUp, 
  MapPin, 
  Droplets, 
  Zap, 
  User,
  Heart,
  Share2,
  ShoppingCart
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { api } from '@/integrations/api/client';
import kilimoLogo from '@/assets/kilimo-logo.png';
import { useContactSettings } from '@/hooks/use-contact-settings';
import DOMPurify from 'dompurify';
import { useCopyProtection } from "@/hooks/use-copy-protection";
import CopyProtectionDialog from "@/components/CopyProtectionDialog";
import { useCartContext } from "@/context/CartContext";

interface ReviewData {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { fullName?: string; avatarUrl?: string };
}

interface SeedProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  variety: string;
  price: number;
  unit: string;
  images: string[];
  rating: number;
  reviews: number;
  reviewsList: ReviewData[];
  availability: string;
  harvestTime: string;
  yield: string;
  features: string[];
  fullDescription: string;
  isCopyProtected: boolean;
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

export default function SeedDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCartContext();
  const [product, setProduct] = useState<SeedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    const shareData = {
      title: product?.name || "KILIMO Agritech",
      text: `Découvrez la semence ${product?.name} (${product?.variety}) sur KILIMO Agritech.`,
      url: window.location.href,
    };
    try {
      if (typeof navigator.share !== 'undefined') {
        setIsSharing(true);
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Lien copié", description: "Le lien de la semence a été copié." });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const { data: contactSettings } = useContactSettings();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { isDialogOpen, closeDialog } = useCopyProtection(
    !!product?.isCopyProtected,
    {
      title: product?.name || "",
      imageUrl: product?.images?.[0],
      excerpt: product?.description,
      url: window.location.href,
    }
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await api.auth.getSession();
        const user = sessionData?.session?.user;
        if (user?.id) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    const handleAuthChange = () => {
      checkAuth();
    };

    checkAuth();

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const fetchSeed = useCallback(async () => {
    if (!slug) return;
    try {
      const apiResponse = await api.request('GET', `/api/seeds/slug/${slug}`);
      const seedData = (apiResponse && 'data' in apiResponse) ? apiResponse.data : apiResponse;
      
      let images = [seedData.imageUrl || seedData.image_url || kilimoLogo];
      if (Array.isArray(seedData.gallery) && seedData.gallery.length > 0) {
        images = seedData.gallery;
      } else if (typeof seedData.gallery === 'string' && seedData.gallery.length > 0) {
        try {
          const parsed = JSON.parse(seedData.gallery);
          if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
        } catch {
          const split = seedData.gallery.split(',').map((u: string) => u.trim()).filter(Boolean);
          if (split.length > 0) images = split;
        }
      } else if (Array.isArray(seedData.images) && seedData.images.length > 0) {
        images = seedData.images;
      }

      const primaryImage = seedData.imageUrl || seedData.image_url;
      if (primaryImage && !images.includes(primaryImage)) {
        images = [primaryImage, ...images];
      }

      const reviewsList: ReviewData[] = Array.isArray(seedData.reviews) ? seedData.reviews : [];

      setProduct({
        id: seedData.id,
        name: seedData.name,
        description: seedData.description,
        category: seedData.category || 'Général',
        variety: seedData.variety || '',
        price: Number(seedData.price) || Number(seedData.price_fcfa) || 0,
        unit: seedData.unit || 'kg',
        images,
        rating: Number(seedData.rating) || 0,
        reviews: Number(seedData.totalReviews) || Number(seedData.total_reviews) || 0,
        reviewsList,
        availability: seedData.availability || 'En stock',
        harvestTime: seedData.harvestTime || seedData.harvest_time || '120-140 jours',
        yield: seedData.yield || seedData.yield_info || '8-12 tonnes/ha',
        features: Array.isArray(seedData.features) ? seedData.features : [],
        fullDescription: seedData.fullDescription || seedData.description,
        isCopyProtected: !!(seedData.isCopyProtected || seedData.is_copy_protected),
        specifications: {
          origin: seedData.origin || 'Local',
          purity: seedData.purity || '99%',
          germination: seedData.germination || '95%',
          moisture: seedData.moisture || '12%',
          packaging: seedData.packaging || 'Sachet 25kg'
        },
        growingGuide: {
          soilType: seedData.soilType || 'Sol bien drainé',
          plantingDepth: seedData.plantingDepth || '2-3 cm',
          spacing: seedData.spacing || '75x25 cm',
          watering: seedData.watering || 'Régulier',
          fertilizer: seedData.fertilizer || 'NPK équilibré',
          diseases: Array.isArray(seedData.diseases) ? seedData.diseases : []
        }
      });
    } catch (err) {
      console.error('Error fetching seed:', err);
      toast({ title: "Erreur", description: "Impossible de charger les détails de la semence.", variant: "destructive" });
      navigate('/seeds');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate, toast]);

  useEffect(() => {
    fetchSeed();
  }, [fetchSeed]);

  const logContact = async (type: string) => {
    try {
      const userStr = sessionStorage.getItem('kilimo_auth_user');
      const user = userStr ? JSON.parse(userStr) : {};
      await api.request('POST', '/api/contact_messages', {
        body: {
          name: user.fullName || 'Utilisateur',
          email: user.email || 'anonyme@kilimo.tg',
          subject: `Intérêt pour ${product?.name} (${type})`,
          message: `L'utilisateur a cliqué sur le bouton ${type} pour le produit ${product?.name} (ID: ${product?.id}).`,
          project_type: 'seeds'
        }
      });
    } catch (err) {
      console.error('Error logging contact:', err);
    }
  };

  const handleWhatsApp = async () => {
    await logContact('whatsapp');
    const whatsapp = contactSettings?.whatsappNumber || "+22600000000";
    const message = encodeURIComponent(`Bonjour KILIMO, je suis intéressé par la semence : ${product?.name} (Réf: ${product?.id})`);
    window.open(`https://wa.me/${whatsapp.replace(/\s+/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = async () => {
    await logContact('call');
    const phone = contactSettings?.phone || contactSettings?.whatsappNumber || "+22600000000";
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const toggleFavorite = () => {
    if (!isLoggedIn) {
      toast({ title: "Authentification requise", description: "Veuillez vous connecter pour ajouter ce produit à vos favoris." });
      navigate('/auth');
      return;
    }
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite ? "Le produit a été retiré de votre liste." : "Le produit a été ajouté à votre liste de favoris.",
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast({ title: "Authentification requise", description: "Veuillez vous connecter pour laisser un avis." });
      return;
    }

    try {
      await api.request('POST', `/api/seeds/${product?.id}/reviews`, {
        body: reviewForm,
      });
      toast({ title: "Merci !", description: "Votre avis a été publié avec succès." });
      setReviewForm({ rating: 5, comment: '' });
      fetchSeed();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast({ title: "Erreur", description: "Impossible de publier l'avis.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={product.name}
        description={product.description.replace(/<[^>]*>/g, '')}
        image={product.images[0]}
        type="product"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description.replace(/<[^>]*>/g, ''),
            "image": product.images[0].startsWith('http') ? product.images[0] : `${window.location.origin}${product.images[0]}`,
            "brand": { "@type": "Organization", "name": "KILIMO" },
            "category": "Semences agricoles",
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "XOF",
              "price": product.price,
              "availability": product.availability === "En stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
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
              { "@type": "ListItem", position: 2, name: "Semences", item: window.location.origin + "/seeds" },
              { "@type": "ListItem", position: 3, name: product.name, item: window.location.href },
            ],
          },
        ]}
      />
      <Header />
      
      {product && (
        <CopyProtectionDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          item={{
            title: product.name,
            imageUrl: product.images[0],
            excerpt: product.description,
            url: window.location.href,
          }}
        />
      )}

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/seeds" className="inline-flex items-center text-primary hover:underline mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Retour aux semences
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-card rounded-3xl p-6 md:p-10 shadow-sm border border-border">
            {/* Image Section */}
            <div className="space-y-6">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center relative group">
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform hover:scale-105 duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = kilimoLogo; }}
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((img, idx) => (
                    <button 
                      key={`${product.id}-gallery-${idx}-${img.slice(-10)}`}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted flex items-center justify-center ${
                        selectedImage === idx ? 'border-primary shadow-md scale-105' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">
                  {product.category}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground hover:text-primary gap-2 ml-auto">
                  <Share2 className="w-4 h-4" />
                  Partager
                </Button>
                <div className="flex items-center text-amber-500 ml-4">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="ml-1 text-muted-foreground text-sm">({product.reviews} avis)</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-muted-foreground text-lg">{product.variety}</p>
                {isLoggedIn && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleFavorite}
                    className={`rounded-full ${isFavorite ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-bold text-primary">{product.price.toLocaleString()} FCFA</span>
                <span className="text-muted-foreground font-medium">/ {product.unit}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                  <span className="font-medium">Disponibilité :</span>
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">{product.availability}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-5 h-5 text-primary/60 mr-3" />
                  <span className="font-medium">Temps de récolte :</span>
                  <span className="ml-2">{product.harvestTime}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <TrendingUp className="w-5 h-5 text-primary/60 mr-3" />
                  <span className="font-medium">Rendement estimé :</span>
                  <span className="ml-2">{product.yield}</span>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-2xl mb-8 border border-border">
                <div 
                  className="text-muted-foreground leading-relaxed italic prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                />
              </div>

              {/* Add to Cart */}
              <div className="mb-6">
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                  disabled={product.availability === 'Rupture'}
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      productType: 'seed',
                      name: product.name,
                      price: product.price,
                      image: product.images[0] || kilimoLogo,
                      inStock: product.availability !== 'Rupture',
                    });
                    toast({ title: "Semence ajoutée au panier", description: `${product.name} ajouté avec succès` });
                  }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.availability === 'Rupture' ? 'Rupture de stock' : 'Ajouter au panier'}
                </Button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Contactez-nous pour ce produit
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1 h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleWhatsApp}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 h-14 rounded-xl text-lg font-bold border-2"
                    onClick={handleCall}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Appeler
                  </Button>
                </div>
              </div>
              <p className="text-center text-muted-foreground text-sm mt-4 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Paiement sécurisé & Qualité garantie
              </p>
            </div>
          </div>

          {/* Detailed Info Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 mb-8 overflow-x-auto">
                <TabsTrigger 
                  value="description" 
                  className="px-8 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-lg transition-all"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="specs" 
                  className="px-8 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-lg transition-all"
                >
                  Spécifications
                </TabsTrigger>
                <TabsTrigger 
                  value="guide" 
                  className="px-8 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-lg transition-all"
                >
                  Guide de culture
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="px-8 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold text-lg transition-all"
                >
                  Avis ({product.reviews})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border focus-visible:outline-none">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.fullDescription) }} className="text-muted-foreground leading-relaxed" />
                </div>
                {product.features.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start p-4 rounded-xl bg-muted/50 border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-foreground font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="specs" className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><MapPin className="w-4 h-4 mr-2" /> Origine</span>
                      <span className="text-foreground font-bold">{product.specifications.origin}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><Sprout className="w-4 h-4 mr-2" /> Variété</span>
                      <span className="text-foreground font-bold">{product.variety}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><Calendar className="w-4 h-4 mr-2" /> Récolte</span>
                      <span className="text-foreground font-bold">{product.harvestTime}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Rendement</span>
                      <span className="text-foreground font-bold">{product.yield}</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Pureté</span>
                      <span className="text-foreground font-bold">{product.specifications.purity}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><Sprout className="w-4 h-4 mr-2" /> Germination</span>
                      <span className="text-foreground font-bold">{product.specifications.germination}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><Droplets className="w-4 h-4 mr-2" /> Humidité</span>
                      <span className="text-foreground font-bold">{product.specifications.moisture}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-muted-foreground font-medium flex items-center"><Truck className="w-4 h-4 mr-2" /> Conditionnement</span>
                      <span className="text-foreground font-bold">{product.specifications.packaging}</span>
                    </div>
                  </div>
                </div>
                {product.features.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-primary" />
                      Caractéristiques
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start p-4 rounded-xl bg-muted/50 border border-border">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="guide" className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Waves className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">Type de sol</h4>
                        <p className="text-muted-foreground">{product.growingGuide.soilType}</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Droplets className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">Arrosage</h4>
                        <p className="text-muted-foreground">{product.growingGuide.watering}</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">Espacement</h4>
                        <p className="text-muted-foreground">{product.growingGuide.spacing}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">Engrais recommandé</h4>
                        <p className="text-muted-foreground">{product.growingGuide.fertilizer}</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-7 h-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">Résistance</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {product.growingGuide.diseases.map((disease, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20">
                              {disease}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 text-center lg:text-left p-8 bg-muted/50 rounded-2xl">
                    <div className="text-6xl font-black text-foreground mb-2">{product.rating.toFixed(1)}</div>
                    <div className="flex items-center justify-center lg:justify-start text-amber-500 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-6 h-6 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground font-medium">Basé sur {product.reviews} avis vérifiés</p>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    {/* Existing reviews */}
                    {product.reviewsList.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">Avis des clients</h3>
                        {product.reviewsList.map((review) => (
                          <div key={review.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium text-foreground">{review.user?.fullName || 'Utilisateur'}</span>
                              </div>
                              <div className="flex items-center text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-foreground">Laissez un avis</h3>
                    
                    {!isLoggedIn ? (
                      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl text-center">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2">Authentification requise</h4>
                        <p className="text-muted-foreground mb-6">Connectez-vous pour partager votre expérience avec cette semence.</p>
                        <Button onClick={() => navigate('/auth')} className="rounded-xl px-8">
                          Se connecter / S'inscrire
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-foreground font-bold">Note</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className={`p-1 transition-transform active:scale-90 ${reviewForm.rating >= star ? 'text-amber-500' : 'text-muted-foreground/30'}`}
                              >
                                <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment" className="text-foreground font-bold">Commentaire</Label>
                          <Textarea 
                            id="comment" 
                            placeholder="Partagez votre expérience de culture..." 
                            className="min-h-[150px] rounded-2xl"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          />
                        </div>
                        <Button type="submit" size="lg" className="rounded-xl px-12 font-bold shadow-lg shadow-primary/20">
                          Publier l'avis
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
