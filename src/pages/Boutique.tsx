import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, Leaf, ShoppingBag, Package, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useI18n } from "@/i18n";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import { BoutiqueItemCard, type BoutiqueItemData } from "@/components/pwa/shop/BoutiqueItemCard";
import BoutiqueAppView from "@/components/pwa/shop/BoutiqueAppView";
import kilimoLogo from "@/assets/kilimo-logo.png";

export interface BoutiqueItem extends BoutiqueItemData {
  description: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

async function fetchJson(path: string) {
  const url = new URL(path, apiBaseUrl);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const body = await res.json();
  return (Array.isArray(body) ? body : body?.data) || [];
}

const Boutique = () => {
  const { t } = useI18n();
  const isStandalone = useStandalonePwa();
  const { addToCart } = useCartContext();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<BoutiqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const typeParam = (searchParams.get("type") as "all" | "semences" | "equipements") || "all";

  const setType = (value: "all" | "semences" | "equipements") => {
    setSelectedCategory("all");
    setSearchParams(value === "all" ? {} : { type: value }, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [seedsRaw, productsRaw] = await Promise.all([
        fetchJson("/api/seeds").catch(() => []),
        fetchJson("/api/shop_products").catch(() => []),
      ]);

      const seeds: BoutiqueItem[] = (seedsRaw || []).map((s: any) => ({
        id: `seed-${s.id}`,
        type: "seed" as const,
        slug: String(s.slug || s.id),
        name: String(s.name || ""),
        description: String(s.description || ""),
        category: String(s.category || t("boutique.uncategorized")),
        price: Number(s.price) || 0,
        unit: String(s.unit || "kg"),
        image: String(s.imageUrl || s.image_url || kilimoLogo),
        rating: Number(s.rating) || 0,
        reviews: Number(s.totalReviews ?? s.total_reviews) || 0,
        inStock: (s.availability || "En stock") !== "Rupture",
        badge: s.availability === "Pré-commande" ? t("boutique.preorder") : undefined,
      }));

      const products: BoutiqueItem[] = (productsRaw || []).map((p: any) => ({
        id: `product-${p.id}`,
        type: "product" as const,
        slug: String(p.slug || p.id),
        name: String(p.name || ""),
        description: String(p.description || ""),
        category: String(p.category || t("boutique.uncategorized")),
        price: Number(p.price ?? p.price_fcfa) || 0,
        image: String(p.imageUrl || p.image_url || kilimoLogo),
        rating: Number(p.rating) || 0,
        reviews: Number(p.reviews ?? p.reviews_count) || 0,
        inStock: Boolean(p.isActive ?? p.in_stock ?? true),
        badge: (p.isNew ?? p.is_new) ? t("boutique.new") : (p.isBestSeller ?? p.is_bestseller) ? t("boutique.bestseller") : undefined,
      }));

      setItems([...seeds, ...products]);
    } catch (e) {
      console.error("[Boutique] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const typeFiltered = useMemo(() => {
    if (typeParam === "semences") return items.filter((i) => i.type === "seed");
    if (typeParam === "equipements") return items.filter((i) => i.type === "product");
    return items;
  }, [items, typeParam]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(typeFiltered.map((i) => i.category).filter(Boolean))).sort();
    return [{ id: "all", name: t("boutique.cat_all") }, ...unique.map((c) => ({ id: c, name: c }))];
  }, [typeFiltered, t]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return typeFiltered.filter((i) => {
      const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [typeFiltered, searchQuery, selectedCategory]);

  const handleAddToCart = async (item: BoutiqueItem) => {
    if (!item.inStock) return;
    await addToCart({
      id: item.id.replace(/^(seed|product)-/, ""),
      productType: item.type === "seed" ? "seed" : "shop_product",
      name: item.name,
      price: item.price,
      image: item.image,
      inStock: item.inStock,
    });
    toast({ title: t("boutique.added"), description: item.name });
  };

  const seo = (
    <SEO
      title={t("boutique.meta.title")}
      description={t("boutique.meta.desc")}
      path={window.location.origin + "/boutique"}
      image={kilimoLogo}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: t("boutique.meta.title"),
        description: t("boutique.meta.desc"),
        url: window.location.origin + "/boutique",
        numberOfItems: filtered.length,
      }}
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <BoutiqueAppView
          items={filtered}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          typeParam={typeParam}
          setType={setType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loading={loading}
          onAddToCart={handleAddToCart}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />

      {/* Hero compact — pensé mobile d'abord */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 pt-6 pb-6 px-4 sm:pt-10 sm:pb-8">
        <div className="container mx-auto">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1.5 sm:mb-3">
            {t("boutique.title")}
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl">
            {t("boutique.subtitle")}
          </p>
        </div>
      </section>

      {/* Barre de recherche + filtres — sticky sous le header (top-16 : le
          Header global est fixed en h-16, sinon cette barre disparaîtrait
          derrière lui au scroll), tactile */}
      <section className="sticky top-16 z-20 bg-background/95 backdrop-blur-md border-b border-border/60 py-3 px-4">
        <div className="container mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("boutique.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-sm rounded-full border-2"
            />
          </div>

          {/* Type : Tout / Semences / Équipements */}
          <div className="flex gap-2">
            {[
              { id: "all" as const, label: t("boutique.type_all"), icon: null },
              { id: "semences" as const, label: t("boutique.type_seeds"), icon: Leaf },
              { id: "equipements" as const, label: t("boutique.type_products"), icon: ShoppingBag },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setType(opt.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  typeParam === opt.id
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Catégories — chips défilables horizontalement */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === c.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grille produits — 2 colonnes dès le mobile, cartes compactes */}
      <section className="py-5 px-4">
        <div className="container mx-auto">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {filtered.length} {filtered.length > 1 ? t("boutique.results_plural") : t("boutique.results_single")}
          </p>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("boutique.loading")}</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((item) => (
                <BoutiqueItemCard
                  key={item.id}
                  item={item}
                  typeLabel={item.type === "seed" ? t("boutique.type_seeds") : t("boutique.type_products")}
                  outOfStockLabel={t("boutique.out_of_stock")}
                  perLabel={t("boutique.per")}
                  addToCartLabel={t("boutique.add_to_cart")}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-1">{t("boutique.none")}</h3>
              <p className="text-sm text-muted-foreground">{t("boutique.try_adjust")}</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Boutique;
