import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "@/integrations/api/client";
import { cn } from "@/lib/utils";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";

const HIDDEN_PREFIXES = ["/assistant", "/admin", "/supervisor", "/checkout"];

export default function ChatBubble() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [authed, setAuthed] = useState(false);
  const isStandalone = useStandalonePwa();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { data } = await api.auth.getSession();
        if (!cancelled) setAuthed(!!data?.session?.user);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    };
    check();
    const onChange = () => check();
    window.addEventListener("auth-change", onChange);
    return () => { cancelled = true; window.removeEventListener("auth-change", onChange); };
  }, []);

  if (HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  // Ces fiches détail PWA (cours, semence, produit) affichent chacune leur
  // propre barre d'action collante (prix + CTA) juste au-dessus de la nav
  // basse — la bulle s'y superposerait (même zone verticale) et masquerait
  // ce CTA principal.
  const hasStickyDetailActionBar = isStandalone && (
    /^\/elearning\/[^/]+$/.test(pathname) ||
    /^\/seeds\/[^/]+$/.test(pathname) ||
    /^\/shop\/[^/]+$/.test(pathname)
  );
  if (hasStickyDetailActionBar) return null;

  const handleClick = () => {
    if (!authed) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
    } else {
      navigate("/assistant");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 transition",
        "hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
        // En PWA standalone, la nav basse (h-16 + safe-area) occupe le bas de
        // l'écran — sans ce décalage la bulle se pose dessus et intercepte
        // les taps destinés à l'onglet "Menu".
        isStandalone ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-5"
      )}
      aria-label="Ouvrir KILIMO Assistant"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-secondary ring-2 ring-background" />
    </button>
  );
}