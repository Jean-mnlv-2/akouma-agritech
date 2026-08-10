import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Newspaper, GraduationCap, Home, ShoppingBag, Menu } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useI18n();
  const { setIsOpen } = useMobileMenu();
  const isStandalone = useStandalonePwa();

  // Le padding réservant la place de la barre (voir index.css,
  // body.has-standalone-bottom-nav) ne doit exister que quand la barre est
  // réellement affichée — sinon un navigateur mobile classique aurait un
  // vide en bas de chaque page pour rien.
  useEffect(() => {
    document.body.classList.toggle("has-standalone-bottom-nav", isStandalone);
    return () => document.body.classList.remove("has-standalone-bottom-nav");
  }, [isStandalone]);

  const isActive = (prefixes: string[]) =>
    prefixes.some((p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p)));

  if (!isStandalone) return null;

  const sideItems = [
    { key: "news", to: "/news", icon: Newspaper, label: t("nav.news"), active: isActive(["/news"]) },
    { key: "elearning", to: "/elearning", icon: GraduationCap, label: t("nav.elearning"), active: isActive(["/elearning", "/my-courses", "/dashboard/learning"]) },
  ];
  const rightItems = [
    { key: "boutique", to: "/boutique", icon: ShoppingBag, label: t("nav.boutique"), active: isActive(["/boutique", "/shop", "/seeds"]) },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale"
    >
      <div className="relative grid grid-cols-5 items-center h-16">
        {sideItems.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
              item.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
            {item.label}
          </Link>
        ))}

        {/* Accueil — bouton central surélevé */}
        <div className="flex items-center justify-center h-full">
          <Link
            to="/"
            aria-label={t("nav.home")}
            className={`flex items-center justify-center w-12 h-12 rounded-full -translate-y-3.5 shadow-lg shadow-primary/30 border-4 border-background transition-transform active:scale-95 ${
              isActive(["/"]) ? "bg-primary text-primary-foreground" : "bg-primary/90 text-primary-foreground"
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </div>

        {rightItems.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
              item.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
            {item.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium text-muted-foreground transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
          {t("header.menu")}
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
