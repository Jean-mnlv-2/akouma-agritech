import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "@/integrations/api/client";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/assistant", "/admin", "/supervisor", "/auth", "/checkout"];

export default function ChatBubble() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [authed, setAuthed] = useState(false);

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

  if (!authed) return null;
  if (HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/assistant")}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 transition",
        "hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      )}
      aria-label="Ouvrir KILIMO Assistant"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-secondary ring-2 ring-background" />
    </button>
  );
}