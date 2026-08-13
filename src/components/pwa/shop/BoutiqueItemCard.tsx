import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, ShoppingBag, ShoppingCart, Star } from "lucide-react";

export type BoutiqueItemType = "seed" | "product";

export interface BoutiqueItemData {
  id: string;
  type: BoutiqueItemType;
  slug: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  badge?: string;
}

interface BoutiqueItemCardProps<T extends BoutiqueItemData> {
  item: T;
  typeLabel: string;
  outOfStockLabel: string;
  perLabel: string;
  addToCartLabel: string;
  onAddToCart: (item: T) => void;
}

/**
 * Carte produit compacte partagée entre le catalogue Boutique desktop/mobile
 * web (Boutique.tsx) et la vue app standalone (BoutiqueAppView) — un seul
 * design de carte à faire évoluer. Générique sur `T` pour accepter le type
 * `BoutiqueItem` (superset avec `description`) défini côté page sans
 * dupliquer l'interface ni casser la variance des callbacks.
 */
export function BoutiqueItemCard<T extends BoutiqueItemData>({ item, typeLabel, outOfStockLabel, perLabel, addToCartLabel, onAddToCart }: BoutiqueItemCardProps<T>) {
  const detailHref = item.type === "seed" ? `/seeds/${item.slug}` : `/shop/${item.slug}`;
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-CF", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(price);

  return (
    <Card className="group overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-card">
      <Link to={detailHref} className="block relative aspect-square bg-muted/30 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs px-1.5 py-0 bg-background/90 backdrop-blur-sm border-border/50">
          {item.type === "seed" ? <Leaf className="w-2.5 h-2.5 mr-1" /> : <ShoppingBag className="w-2.5 h-2.5 mr-1" />}
          {typeLabel}
        </Badge>
        {item.badge && (
          <Badge className="absolute top-2 right-2 text-xs px-1.5 py-0 bg-primary text-primary-foreground">{item.badge}</Badge>
        )}
        {!item.inStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">{outOfStockLabel}</Badge>
          </div>
        )}
      </Link>

      <div className="p-2.5 sm:p-3.5">
        <Link to={detailHref}>
          <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.2em] group-hover:text-primary transition-colors">
            {item.name}
          </h3>
        </Link>
        {item.reviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-muted-foreground">{item.rating.toFixed(1)} ({item.reviews})</span>
          </div>
        )}
        <div className="flex items-end justify-between mt-2 gap-1.5">
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold text-primary truncate">{formatPrice(item.price)}</p>
            {item.unit && <p className="text-sm text-muted-foreground">{perLabel} {item.unit}</p>}
          </div>
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={!item.inStock}
            onClick={() => onAddToCart(item)}
            aria-label={addToCartLabel}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default BoutiqueItemCard;
