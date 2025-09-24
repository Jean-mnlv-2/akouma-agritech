import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, Leaf, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { ThemeToggle } from "@/components/theme-toggle";
import CartDrawer from "./CartDrawer";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n/i18n";

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const { getCartItemsCount } = useCartContext();
  const itemsCount = getCartItemsCount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Handle mobile nav scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide mobile nav
        setIsMobileNavVisible(false);
      } else {
        // Scrolling up - show mobile nav
        setIsMobileNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load user roles to show contextual links
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data: session } = await api.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          setIsAdmin(false);
          setIsSupervisor(false);
          return;
        }
        const { data: roles } = await api
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        const admin = roles?.some(r => r.role === 'admin') ?? false;
        const supervisor = admin || (roles?.some(r => r.role === 'supervisor') ?? false);
        setIsAdmin(admin);
        setIsSupervisor(supervisor);
      } catch {
        setIsAdmin(false);
        setIsSupervisor(false);
      }
    };
    loadRoles();
  }, []);

  const { t, available, lang, setLang } = useI18n();

  const navigation = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.elearning"), href: "/elearning" },
    { name: t("nav.seeds"), href: "/seeds" },
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.agri"), href: "/agri-consulting" },
    { name: t("nav.partners"), href: "/partners" },
    { name: t("nav.donations"), href: "/donations" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.news"), href: "/news" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
                alt="AKOUMA Logo" 
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold text-primary">
                AKOUMA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {t("nav.admin")}
                  </Link>
                  <Link
                    to="/admin/tasks"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/admin/tasks' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {t("nav.tasks")}
                  </Link>
                  <Link
                    to="/admin/elearning-enrollments"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/admin/elearning-enrollments' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {t("nav.elearning")}
                  </Link>
                  <Link
                    to="/admin/live-streams"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/admin/live-streams' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Live Streams
                  </Link>
                  <Link
                    to="/admin/elearning-stats"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/admin/elearning-stats' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Stats
                  </Link>
                </>
              )}
              {!isAdmin && isSupervisor && (
                <Link
                  to="/supervisor"
                  className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/supervisor' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {t("nav.supervisor")}
                </Link>
              )}
              <div className="flex items-center space-x-2">
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
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
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
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">{t("header.menu")}</h2>
                    <ThemeToggle />
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsCartOpen(true)}
                      className="w-full relative"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t("header.cart")} ({itemsCount})
                    </Button>
                    <div className="mt-4">
                      <select
                        className="w-full bg-transparent text-sm border rounded px-2 py-2"
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
        <div className={`md:hidden border-t border-border/50 transition-transform duration-300 ${
          isMobileNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="container mx-auto px-6">
            <nav className="flex items-center space-x-6 py-3 overflow-x-auto scrollbar-hide">
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
                <>
                  <Link
                    to="/admin"
                    className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Admin
                  </Link>
                  <Link
                    to="/admin/tasks"
                    className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname === '/admin/tasks' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Tâches
                  </Link>
                  <Link
                    to="/admin/elearning-enrollments"
                    className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname === '/admin/elearning-enrollments' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    E-Learning
                  </Link>
                  <Link
                    to="/admin/live-streams"
                    className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname === '/admin/live-streams' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Live Streams
                  </Link>
                  <Link
                    to="/admin/elearning-stats"
                    className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname === '/admin/elearning-stats' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Stats
                  </Link>
                </>
              )}
              {!isAdmin && isSupervisor && (
                <Link
                  to="/supervisor"
                  className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.pathname === '/supervisor' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  Mon tableau
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
};

export default Header;