import { useState } from "react";
import DOMPurify from "dompurify";
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, Award, CheckCircle, Settings, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { StickyActionBar } from "@/components/pwa/StickyActionBar";
import { ProductImageGallery } from "@/components/pwa/shop/ProductImageGallery";
import type { Product } from "@/pages/ProductDetail";

interface ProductDetailAppViewProps {
  product: Product;
  quantity: number;
  setQuantity: (q: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onAddToCart: () => void;
  formatPrice: (price: number) => string;
}

export function ProductDetailAppView({
  product, quantity, setQuantity, isFavorite, onToggleFavorite, onShare, onAddToCart, formatPrice,
}: ProductDetailAppViewProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const specs = Object.entries(product.specifications);

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

      <ProductImageGallery images={product.gallery} alt={product.name} />

      <div className="px-4 pt-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {product.isNew && <Badge variant="secondary" className="text-[11px]">Nouveau</Badge>}
            {product.isBestSeller && <Badge variant="destructive" className="text-[11px]">Bestseller</Badge>}
            <Badge variant="outline" className="text-[11px]">{product.category}</Badge>
          </div>
          <h1 className="text-xl font-bold leading-tight mb-1.5">{product.name}</h1>
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{product.rating} ({product.reviews} avis)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>

        <div>
          <div
            className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.longDescription) }}
          />
          {product.longDescription.length > 160 && (
            <button type="button" onClick={() => setDescExpanded((v) => !v)} className="text-primary text-xs font-semibold mt-1">
              {descExpanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {/* Quantité */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2.5">
          <span className="text-sm font-semibold">Quantité</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold">{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bénéfices */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Truck, label: "Livraison gratuite" },
            { icon: Shield, label: "Garantie 2 ans" },
            { icon: Award, label: "Support technique" },
          ].map((b, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-2.5 text-center">
              <b.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] font-medium leading-tight text-muted-foreground">{b.label}</p>
            </div>
          ))}
        </div>

        {/* Détails */}
        <Accordion type="single" collapsible className="space-y-2">
          {product.features.length > 0 && (
            <AccordionItem value="features" className="border border-border/60 rounded-xl px-3.5">
              <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />Caractéristiques</span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2">
                {product.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{f.replace(/<[^>]*>/g, "")}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {specs.length > 0 && (
            <AccordionItem value="specs" className="border border-border/60 rounded-xl px-3.5">
              <AccordionTrigger className="text-sm font-bold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />Spécifications techniques</span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-2.5 text-sm">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-semibold">{String(value).replace(/<[^>]*>/g, "")}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      <StickyActionBar>
        <div className="shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total</p>
          <p className="text-lg font-black text-primary leading-none">{formatPrice(product.price * quantity)}</p>
        </div>
        <Button className="flex-1 h-12 rounded-xl font-bold" disabled={!product.inStock} onClick={onAddToCart}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.inStock ? "Ajouter au panier" : "Rupture de stock"}
        </Button>
      </StickyActionBar>
    </div>
  );
}

export default ProductDetailAppView;
