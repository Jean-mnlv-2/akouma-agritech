import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, ShoppingCart, LogIn, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { ThemeToggle } from "@/components/theme-toggle";
import CartDrawer from "./CartDrawer";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n/i18n";

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const { getCartItemsCount } = useCartContext();
  const itemsCount = getCartItemsCount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMobileNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsMobileNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load user roles to show contextual links
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data: session } = await api.auth.getSession();
        const user = session?.session?.user || session?.user;
        const userId = user?.id;
        if (!userId) {
          setIsAdmin(false);
          setIsSupervisor(false);
          setIsLoggedIn(false);
          setUserName(null);
          return;
        }
        setIsLoggedIn(true);
        setUserName(user?.fullName || user?.email || null);
        
        const { data: roles } = await api
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        const admin = roles?.some((r: { role: string }) => r.role === 'admin') ?? false;
        const supervisor = admin || (roles?.some((r: { role: string }) => r.role === 'supervisor') ?? false);
        setIsAdmin(admin);
        setIsSupervisor(supervisor);
      } catch {
        setIsAdmin(false);
        setIsSupervisor(false);
        setIsLoggedIn(false);
      }
    };
    loadRoles();
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.signOut();
      setIsLoggedIn(false);
      setIsAdmin(false);
      setIsSupervisor(false);
      setUserName(null);
      window.location.href = '/';
    } catch {
      // ignore
    }
  };

  const { t, available, lang, setLang } = useI18n();

  const navigation = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.elearning"), href: "/elearning" },
    { name: t("nav.seeds"), href: "/seeds" },
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.news"), href: "/news" },
    { name: t("nav.agri"), href: "/agri-consulting" },
    { name: t("nav.partners"), href: "/partners" },
    { name: t("nav.donations"), href: "/donations" },
    { name: t("nav.about"), href: "/about" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img 
                src="/logo-ak.png"
                alt="AKOUMA Logo" 
                className="w-8 h-8 md:w-12 md:h-12"
              />
              <span className="text-xl md:text-2xl font-bold text-primary">
                AKOUMA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-base font-medium transition-colors hover:text-primary ${
                    location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-base font-medium transition-colors hover:text-primary ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {t("nav.admin")}
                </Link>
              )}
              {!isAdmin && isSupervisor && (
                <Link
                  to="/supervisor"
                  className={`text-base font-medium transition-colors hover:text-primary ${location.pathname === '/supervisor' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {t("nav.supervisor")}
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden lg:flex items-center">
                <select
                  className="bg-transparent text-sm border rounded px-2 py-1"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  aria-label="Language selector"
                >
                  {available.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <ThemeToggle />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0 min-w-[1.25rem]"
                  >
                    {itemsCount}
                  </Badge>
                )}
              </Button>

              {/* Login / User button */}
              {isLoggedIn ? (
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-sm" asChild>
                    <Link to={isAdmin ? "/admin" : isSupervisor ? "/supervisor" : "/"}>
                      <UserIcon className="w-4 h-4 mr-1" />
                      <span className="max-w-[100px] truncate">{userName?.split(' ')[0] || 'Mon compte'}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleLogout}>
                    {t("header.logout") || "Déconnexion"}
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" className="hidden md:flex text-sm" asChild>
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-1" />
                    {t("header.login") || "Se connecter"}
                  </Link>
                </Button>
              )}
              
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">{t("header.menu")}</h2>
                    <ThemeToggle />
                  </div>

                  {/* Mobile auth section */}
                  <div className="mb-6 pb-4 border-b border-border">
                    {isLoggedIn ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <UserIcon className="w-4 h-4" />
                          <span className="truncate">{userName || 'Mon compte'}</span>
                        </div>
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link to="/admin">Dashboard Admin</Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                          {t("header.logout") || "Déconnexion"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="default" size="sm" className="w-full" asChild>
                        <Link to="/auth">
                          <LogIn className="w-4 h-4 mr-2" />
                          {t("header.login") || "Se connecter"}
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Mobile nav links */}
                  <nav className="space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`block text-base font-medium transition-colors hover:text-primary ${
                          location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsCartOpen(true)}
                      className="w-full relative py-6 text-base"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {t("header.cart")} ({itemsCount})
                    </Button>
                    <div className="mt-6">
                      <select
                        className="w-full bg-transparent text-base border rounded px-3 py-3"
                        value={lang}
                        onChange={(e) => setLang(e.target.value as any)}
                        aria-label="Language selector"
                      >
                        {available.map((opt) => (
                          <option key={opt.code} value={opt.code}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation - Horizontal Scrollable */}
        <div className={`lg:hidden border-t border-border/50 transition-all duration-300 ${
          isMobileNavVisible ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="container mx-auto px-4">
            <nav className="flex items-center space-x-5 py-3 overflow-x-auto scrollbar-hide hide-scrollbar">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${
                    location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16 lg:h-16" />
      <div className="lg:hidden h-[2.75rem]" />

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
};

export default Header;
