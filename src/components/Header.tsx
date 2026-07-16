import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, ShoppingCart, LogIn, User as UserIcon, LogOut, LayoutDashboard, History, PiggyBank, GraduationCap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { ThemeToggle } from "@/components/theme-toggle";
import CartDrawer from "./CartDrawer";
import { api } from "@/integrations/api/client";
import { useI18n, LanguageCode } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
        const { data: sessionData } = await api.auth.getSession();
        const user = sessionData?.session?.user;
        
        if (!user || !user.id) {
          setIsAdmin(false);
          setIsSupervisor(false);
          setIsLoggedIn(false);
          setUserName(null);
          return;
        }
        
        setIsLoggedIn(true);
        setUserName(user.fullName || user.email || null);
        
        const userRole = user.role;
        const admin = userRole === 'admin';
        const supervisor = admin || userRole === 'supervisor';
        
        if (!userRole) {
          try {
            const { data: roles } = await api
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id);
            
            const hasAdminRole = roles?.some((r: { role: string }) => r.role === 'admin') ?? false;
            const hasSupervisorRole = hasAdminRole || (roles?.some((r: { role: string }) => r.role === 'supervisor') ?? false);
            
            setIsAdmin(hasAdminRole);
            setIsSupervisor(hasSupervisorRole);
          } catch (e) {
            console.warn("[Header] Could not fetch roles from user_roles table", e);
          }
        } else {
          setIsAdmin(admin);
          setIsSupervisor(supervisor);
        }
      } catch (error) {
        console.error("[Header] Error loading roles:", error);
        setIsAdmin(false);
        setIsSupervisor(false);
        setIsLoggedIn(false);
      }
    };

    loadRoles();

    const handleAuthChange = () => loadRoles();
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.auth.signOut();
      setIsLoggedIn(false);
      setIsAdmin(false);
      setIsSupervisor(false);
      setUserName(null);
      window.dispatchEvent(new Event('auth-change'));
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
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img 
                src="/kilimo-logo.png"
                alt="Kilimo Logo" 
                className="h-9 md:h-12 w-auto object-contain"
                width={48}
                height={48}
              />
              <span className="text-xl md:text-2xl font-bold text-primary">
                Kilimo
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
                  onChange={(e) => setLang(e.target.value as LanguageCode)}
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
                aria-label={`Voir le panier (${itemsCount} article${itemsCount !== 1 ? 's' : ''})`}
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
                <div className="hidden md:flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Menu utilisateur">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : <UserIcon className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userName || "Utilisateur"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {isAdmin ? "Administrateur" : isSupervisor ? "Superviseur" : "Client"}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(isAdmin || isSupervisor) && (
                        <DropdownMenuItem asChild>
                          <Link to={isAdmin ? "/admin" : "/supervisor"} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Tableau de bord</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          <span>Mes commandes</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-cashback" className="cursor-pointer">
                          <PiggyBank className="mr-2 h-4 w-4" />
                          <span>Mon Cashback</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-courses" className="cursor-pointer">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          <span>Mes cours</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive" 
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t("header.logout") || "Déconnexion"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
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
                          <Button variant="outline" size="sm" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link to="/admin">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard Admin
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link to="/orders">
                            <History className="mr-2 h-4 w-4" />
                            Mes commandes
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link to="/my-cashback">
                            <PiggyBank className="mr-2 h-4 w-4" />
                            Mon Cashback
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link to="/my-courses">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Mes cours
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start text-destructive" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
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

                  <div className="mb-4">
                    <Button
                      variant="default"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start py-5 text-base"
                    >
                      <Link to={isLoggedIn ? "/assistant" : "/auth?redirect=%2Fassistant"}>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Assistant KILIMO
                      </Link>
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-border">
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
                        onChange={(e) => setLang(e.target.value as LanguageCode)}
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
