import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { api } from "@/integrations/api/client";
import { useI18n, LanguageCode } from "@/i18n";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  LogIn, LogOut, LayoutDashboard, History, PiggyBank, GraduationCap,
  ShieldCheck, Sprout, Handshake, Heart, MessageCircle, CreditCard, Info, Mail,
  TrendingUp, Briefcase, Globe, ChevronRight, FileText, Cookie, ScrollText, Bell,
} from "lucide-react";

interface MenuLink {
  to: string;
  label: string;
  icon: typeof Info;
}

function MenuRow({ to, label, icon: Icon }: MenuLink) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/60 transition-colors"
    >
      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
    </Link>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        {title}
      </h2>
      <div className="bg-card border border-border/60 rounded-2xl divide-y divide-border/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

const Menu = () => {
  const { t, available, lang, setLang } = useI18n();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const push = usePushNotifications();

  const handleToggleNotifications = async (checked: boolean) => {
    const ok = checked ? await push.subscribe() : await push.unsubscribe();
    if (checked && !ok) {
      toast({
        title: "Notifications désactivées",
        description: push.permission === "denied"
          ? "Autorise les notifications dans les réglages de ton appareil pour KILIMO."
          : "Impossible d'activer les notifications pour le moment.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.auth.getSession();
        const user = data?.session?.user;
        if (!user) { setIsLoggedIn(false); setIsAdmin(false); setUserName(null); return; }
        setIsLoggedIn(true);
        setUserName(user.fullName || user.email || null);
        setIsAdmin(user.role === "admin");
      } catch {
        setIsLoggedIn(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.signOut();
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/";
    } catch {
      // ignore
    }
  };

  const discoverLinks: MenuLink[] = [
    { to: "/agri-consulting", label: "Agri-Consulting", icon: Sprout },
    { to: "/partners", label: t("nav.partners"), icon: Handshake },
    { to: "/donations", label: t("nav.donations"), icon: Heart },
    { to: "/assistant", label: "Assistant IA", icon: MessageCircle },
    { to: "/pricing", label: "Abonnements", icon: CreditCard },
  ];

  const aboutLinks: MenuLink[] = [
    { to: "/about", label: t("nav.about"), icon: Info },
    { to: "/contact", label: t("nav.contact"), icon: Mail },
    { to: "/investors", label: "Investisseurs", icon: TrendingUp },
    { to: "/careers", label: "Carrières", icon: Briefcase },
  ];

  const legalLinks: MenuLink[] = [
    { to: "/legal", label: "Mentions légales", icon: FileText },
    { to: "/privacy", label: "Confidentialité", icon: ShieldCheck },
    { to: "/terms", label: "Conditions d'utilisation", icon: ScrollText },
    { to: "/cookies", label: "Cookies", icon: Cookie },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Menu" description="Accès rapide à tout KILIMO" />
      <Header />

      <div className="container mx-auto px-4 py-5 max-w-lg">
        {/* Compte */}
        <div className="mb-6 bg-card border border-border/60 rounded-2xl p-4">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(userName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{userName || "Mon compte"}</p>
                  <p className="text-xs text-muted-foreground">Connecté</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {isAdmin && (
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link to="/admin"><LayoutDashboard className="w-4 h-4 mr-2" />Admin</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link to="/orders"><History className="w-4 h-4 mr-2" />Commandes</Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link to="/my-cashback"><PiggyBank className="w-4 h-4 mr-2" />Cashback</Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link to="/my-courses"><GraduationCap className="w-4 h-4 mr-2" />Mes cours</Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-destructive col-span-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("header.logout")}
                </Button>
              </div>
            </>
          ) : (
            <Button className="w-full" asChild>
              <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />{t("header.login")}</Link>
            </Button>
          )}
        </div>

        <MenuSection title="Découvrir">
          {discoverLinks.map((l) => <MenuRow key={l.to} {...l} />)}
        </MenuSection>

        <MenuSection title="À propos de KILIMO">
          {aboutLinks.map((l) => <MenuRow key={l.to} {...l} />)}
        </MenuSection>

        <MenuSection title="Paramètres">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium">Langue</span>
            <select
              className="bg-transparent text-sm text-muted-foreground border border-border rounded-lg px-2 py-1.5"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              aria-label="Choisir la langue"
            >
              {available.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-sm font-medium">Apparence</span>
            <ThemeToggle />
          </div>
          {push.isSupported && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications</p>
                {push.permission === "denied" && (
                  <p className="text-xs text-muted-foreground">Bloquées dans les réglages de l'appareil</p>
                )}
              </div>
              <Switch
                checked={push.isSubscribed}
                disabled={push.isLoading || push.permission === "denied"}
                onCheckedChange={handleToggleNotifications}
              />
            </div>
          )}
        </MenuSection>

        <MenuSection title="Légal">
          {legalLinks.map((l) => <MenuRow key={l.to} {...l} />)}
        </MenuSection>

        <p className="text-center text-xs text-muted-foreground/60 pb-4">
          KILIMO Agritech
        </p>
      </div>
    </div>
  );
};

export default Menu;
