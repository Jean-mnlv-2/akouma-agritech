import { useState } from "react";
import DOMPurify from "dompurify";
import {
  Star, MessageSquare, Phone, CheckCircle2, Sprout, ShieldCheck, Truck,
  Calendar, Waves, TrendingUp, MapPin, Droplets, Zap, User, Heart, Share2,
  ShoppingCart, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { StickyActionBar } from "@/components/pwa/StickyActionBar";
import { ProductImageGallery } from "@/components/pwa/shop/ProductImageGallery";
import type { SeedProduct } from "@/pages/SeedDetail";

interface SeedDetailAppViewProps {
  product: SeedProduct;
  isLoggedIn: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onWhatsApp: () => void;
  onCall: () => void;
  onAddToCart: () => void;
  reviewForm: { rating: number; comment: string };
  setReviewForm: (form: { rating: number; comment: string }) => void;
  onSubmitReview: (e: React.FormEvent) => void;
  onRequireAuth: () => void;
}

export function SeedDetailAppView({
  product, isLoggedIn, isFavorite, onToggleFavorite, onShare, onWhatsApp, onCall,
  onAddToCart, reviewForm, setReviewForm, onSubmitReview, onRequireAuth,
}: SeedDetailAppViewProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const outOfStock = product.availability === "Rupture";

  return (
    <div className="pb-32">
      <AppPageHeader
        title={product.name}
        backTo="/boutique"
        right={
          <>
            <button type="button" onClick={onToggleFavorite} aria-label="Favoris" className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <button type="button" onClick={onShare} aria-label="Partager" className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
              <Share2 className="w-4 h-4" />
            </button>
          </>
        }
      />

      <ProductImageGallery images={product.images} alt={product.name} />

      <div className="px-4 pt-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{product.category}</Badge>
            {product.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{product.rating.toFixed(1)} ({product.reviews})
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight mb-1">{product.name}</h1>
          {product.variety && <p className="text-sm text-muted-foreground mb-3">{product.variety}</p>}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{product.price.toLocaleString()} FCFA</span>
            <span className="text-sm text-muted-foreground">/ {product.unit}</span>
          </div>
        </div>

        {/* Infos rapides */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-border/60 p-2.5 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-[11px] font-semibold leading-tight">{product.availability}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-2.5 text-center">
            <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-[11px] font-semibold leading-tight">{product.harvestTime}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-2.5 text-center">
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-[11px] font-semibold leading-tight">{product.yield}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <div
            className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.fullDescription) }}
          />
          {product.fullDescription.length > 160 && (
            <button type="button" onClick={() => setDescExpanded((v) => !v)} className="text-primary text-xs font-semibold mt-1">
              {descExpanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={onWhatsApp}>
            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button variant="outline" className="h-11 rounded-xl" onClick={onCall}>
            <Phone className="w-4 h-4 mr-2" /> Appeler
          </Button>
        </div>

        {/* Détails */}
        <Accordion type="single" collapsible className="space-y-2">
          {product.features.length > 0 && (
            <AccordionItem value="features" className="border border-border/60 rounded-xl px-3.5">
              <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">Caractéristiques</AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                {product.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span>{f}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="specs" className="border border-border/60 rounded-xl px-3.5">
            <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">Spécifications</AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5 text-sm">
              {[
                { icon: MapPin, label: "Origine", value: product.specifications.origin },
                { icon: Sprout, label: "Variété", value: product.variety },
                { icon: ShieldCheck, label: "Pureté", value: product.specifications.purity },
                { icon: Sprout, label: "Germination", value: product.specifications.germination },
                { icon: Droplets, label: "Humidité", value: product.specifications.moisture },
                { icon: Truck, label: "Conditionnement", value: product.specifications.packaging },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><s.icon className="w-3.5 h-3.5" />{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="guide" className="border border-border/60 rounded-xl px-3.5">
            <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">Guide de culture</AccordionTrigger>
            <AccordionContent className="pb-3 space-y-3 text-sm">
              {[
                { icon: Waves, label: "Type de sol", value: product.growingGuide.soilType },
                { icon: Droplets, label: "Arrosage", value: product.growingGuide.watering },
                { icon: ClipboardList, label: "Espacement", value: product.growingGuide.spacing },
                { icon: TrendingUp, label: "Engrais recommandé", value: product.growingGuide.fertilizer },
              ].map((g, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <g.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">{g.label}</p>
                    <p className="text-muted-foreground text-xs">{g.value}</p>
                  </div>
                </div>
              ))}
              {product.growingGuide.diseases.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.growingGuide.diseases.map((d, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400">{d}</Badge>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reviews" className="border border-border/60 rounded-xl px-3.5">
            <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">Avis ({product.reviews})</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {product.reviewsList.length > 0 && (
                <div className="space-y-2.5">
                  {product.reviewsList.map((r) => (
                    <div key={r.id} className="p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold flex items-center gap-1.5"><User className="w-3 h-3" />{r.user?.fullName || "Utilisateur"}</span>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`} />)}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
              {isLoggedIn ? (
                <form onSubmit={onSubmitReview} className="space-y-3">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className={reviewForm.rating >= star ? "text-amber-500" : "text-muted-foreground/30"}>
                        <Star className={`w-6 h-6 ${reviewForm.rating >= star ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Partagez votre expérience..."
                    className="min-h-[90px] rounded-xl text-sm"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                  <Button type="submit" size="sm" className="rounded-xl">Publier l'avis</Button>
                </form>
              ) : (
                <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={onRequireAuth}>Se connecter pour laisser un avis</Button>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <StickyActionBar>
        <div className="shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Prix</p>
          <p className="text-lg font-black text-primary leading-none">{product.price.toLocaleString()} F</p>
        </div>
        <Button className="flex-1 h-12 rounded-xl font-bold" disabled={outOfStock} onClick={onAddToCart}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
        </Button>
      </StickyActionBar>
    </div>
  );
}

export default SeedDetailAppView;
