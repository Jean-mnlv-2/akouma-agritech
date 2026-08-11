import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense, useEffect, lazy } from "react";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
        setTimeout(() => {
          const delayedElement = document.getElementById(hash.substring(1));
          if (delayedElement) delayedElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};
// Guards must stay eagerly loaded (wrap lazy pages)
import AdminRoute from "@/components/auth/AdminRoute";
import SupervisorRoute from "@/components/auth/SupervisorRoute";
import CookieConsent from "@/components/CookieConsent";
import ChatBubble from "@/components/chat/ChatBubble";

// Lazy-loaded route components (per-route code splitting)
const Index = lazy(() => import("./pages/Index"));
const ELearning = lazy(() => import("./pages/ELearning"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Seeds = lazy(() => import("./pages/Seeds"));
const SeedDetail = lazy(() => import("./pages/SeedDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const Boutique = lazy(() => import("./pages/Boutique"));
const Menu = lazy(() => import("./pages/Menu"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Demo = lazy(() => import("./pages/Demo"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Legal = lazy(() => import("./pages/Legal"));
const Careers = lazy(() => import("./pages/Careers"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthConfirm = lazy(() => import("./pages/AuthConfirm"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminElearningEnrollments = lazy(() => import("./pages/AdminElearningEnrollments"));
const AdminLiveStreams = lazy(() => import("./pages/AdminLiveStreams"));
const AdminElearningStats = lazy(() => import("./pages/AdminElearningStats"));
const AdminCertificatePreview = lazy(() => import("./pages/AdminCertificatePreview"));
const Supervisor = lazy(() => import("./pages/Supervisor"));
const AgriConsulting = lazy(() => import("./pages/AgriConsulting"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const Donations = lazy(() => import("./pages/Donations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LearningDashboard = lazy(() => import("./pages/LearningDashboard"));
const CourseLearn = lazy(() => import("./pages/CourseLearn"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const CertificateVerify = lazy(() => import("./pages/CertificateVerify"));
const Investors = lazy(() => import("./pages/Investors"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Orders = lazy(() => import("./pages/Orders"));
const MyCashback = lazy(() => import("./pages/MyCashback"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Cookies = lazy(() => import("./pages/Cookies"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="KILIMO-ui-theme">
      <CartProvider>
        <TooltipProvider>
          <div className="stable-ui-container">
            <Toaster />
            <Sonner />
          </div>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <MobileMenuProvider>
            <ScrollToTop />
            <CookieConsent />
            <ChatBubble />
            {/* Nav mobile fixe (Actus/E-Learning/Accueil/Boutique/Menu) — masquée
                à partir de md, où le Header desktop fait déjà le travail. */}
            <MobileBottomNav />
            <Suspense fallback={<LoadingSpinner size="large" text="Chargement..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/elearning" element={<ELearning />} />
                <Route path="/elearning/:slug" element={<CourseDetail />} />
            <Route path="/seeds" element={<Seeds />} />
            <Route path="/seeds/:slug" element={<SeedDetail />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:slug" element={<ProductDetail />} />
                <Route path="/boutique" element={<Boutique />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<NewsDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:slug" element={<EventDetail />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/privacy-settings" element={<PrivacySettings />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} />
                <Route path="/admin/elearning-enrollments" element={<AdminRoute><AdminElearningEnrollments /></AdminRoute>} />
                <Route path="/admin/live-streams" element={<AdminRoute><AdminLiveStreams /></AdminRoute>} />
                <Route path="/admin/elearning-stats" element={<AdminRoute><AdminElearningStats /></AdminRoute>} />
                <Route path="/admin/courses/:id/certificate-preview" element={<AdminRoute><AdminCertificatePreview /></AdminRoute>} />
                <Route path="/supervisor" element={<SupervisorRoute><Supervisor /></SupervisorRoute>} />
                <Route path="/agri-consulting" element={<AgriConsulting />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/partners" element={<Partnerships />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/dashboard/learning" element={<LearningDashboard />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/elearning/:id/learn" element={<CourseLearn />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/my-cashback" element={<MyCashback />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/certificates/verify/:number" element={<CertificateVerify />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/assistant/:threadId" element={<Assistant />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </MobileMenuProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
