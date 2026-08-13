import { useState } from "react";
import { Search, Leaf, ShoppingBag, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { AppHeroBanner } from "@/components/pwa/AppHeroBanner";
import { BoutiqueItemCard } from "@/components/pwa/shop/BoutiqueItemCard";
import { useI18n } from "@/i18n";
import type { BoutiqueItem } from "@/pages/Boutique";
import shopHero from "@/assets/shop-hero.jpg?format=webp&quality=75";

type BoutiqueType = "all" | "semences" | "equipements";

interface BoutiqueAppViewProps {
  items: BoutiqueItem[];
  categories: { id: string; name: string }[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  typeParam: BoutiqueType;
  setType: (t: BoutiqueType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loading: boolean;
  onAddToCart: (item: BoutiqueItem) => void;
}

export function BoutiqueAppView({
  items, categories, selectedCategory, setSelectedCategory, typeParam, setType,
  searchQuery, setSearchQuery, loading, onAddToCart,
}: BoutiqueAppViewProps) {
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(!!searchQuery);

  return (
    <div className="pb-8">
      <AppHeroBanner image={shopHero} title={t("boutique.title")} subtitle="Semences & équipements certifiés" />
      <AppPageHeader
        title={t("boutique.title")}
        subtitle={`${items.length} ${items.length > 1 ? t("boutique.results_plural") : t("boutique.results_single")}`}
        right={
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Rechercher"
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted"
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        }
      >
        {searchOpen && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={t("boutique.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted/40 border-0"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 px-4 pb-2.5">
          {[
            { id: "all" as const, label: t("boutique.type_all"), icon: null },
            { id: "semences" as const, label: t("boutique.type_seeds"), icon: Leaf },
            { id: "equipements" as const, label: t("boutique.type_products"), icon: ShoppingBag },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setType(opt.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-semibold transition-colors ${
                typeParam === opt.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
              {opt.label}
            </button>
          ))}
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold transition-colors ${
                  selectedCategory === c.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </AppPageHeader>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-1">{t("boutique.none")}</h3>
            <p className="text-sm text-muted-foreground">{t("boutique.try_adjust")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <BoutiqueItemCard
                key={item.id}
                item={item}
                typeLabel={item.type === "seed" ? t("boutique.type_seeds") : t("boutique.type_products")}
                outOfStockLabel={t("boutique.out_of_stock")}
                perLabel={t("boutique.per")}
                addToCartLabel={t("boutique.add_to_cart")}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BoutiqueAppView;
