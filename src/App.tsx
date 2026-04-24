import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense, useEffect } from "react";
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
import Index from "./pages/Index";
import ELearning from "./pages/ELearning";
import CourseDetail from "./pages/CourseDetail";
import Seeds from "./pages/Seeds";
import SeedDetail from "./pages/SeedDetail";

import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import EventDetail from "./pages/EventDetail";
import Demo from "./pages/Demo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Legal from "./pages/Legal";
import Careers from "./pages/Careers";
import Admin from "./pages/Admin";
import AdminRoute from "@/components/auth/AdminRoute";
import SupervisorRoute from "@/components/auth/SupervisorRoute";
import AdminAccess from "./pages/AdminAccess";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import AdminTasks from "./pages/AdminTasks";
import AdminElearningEnrollments from "./pages/AdminElearningEnrollments";
import AdminLiveStreams from "./pages/AdminLiveStreams";
import AdminElearningStats from "./pages/AdminElearningStats";
import Supervisor from "./pages/Supervisor";
import AgriConsulting from "./pages/AgriConsulting";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Partnerships from "./pages/Partnerships";
import Donations from "./pages/Donations";
import NotFound from "./pages/NotFound";
import LearningDashboard from "./pages/LearningDashboard";
import CourseLearn from "./pages/CourseLearn";
import ResetPassword from "./pages/ResetPassword";
import OrderDetail from "./pages/OrderDetail";
import Orders from "./pages/Orders";
import MyCashback from "./pages/MyCashback";
import ContactPage from "./pages/ContactPage";
import CookieConsent from "@/components/CookieConsent";
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
            <ScrollToTop />
            <CookieConsent />
            <Suspense fallback={<LoadingSpinner size="large" text="Chargement..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/elearning" element={<ELearning />} />
                <Route path="/elearning/:slug" element={<CourseDetail />} />
            <Route path="/seeds" element={<Seeds />} />
            <Route path="/seeds/:slug" element={<SeedDetail />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:slug" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<NewsDetail />} />
                <Route path="/events/:slug" element={<EventDetail />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/cookies" element={<Legal />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} />
                <Route path="/admin/elearning-enrollments" element={<AdminRoute><AdminElearningEnrollments /></AdminRoute>} />
                <Route path="/admin/live-streams" element={<AdminRoute><AdminLiveStreams /></AdminRoute>} />
                <Route path="/admin/elearning-stats" element={<AdminRoute><AdminElearningStats /></AdminRoute>} />
                <Route path="/supervisor" element={<SupervisorRoute><Supervisor /></SupervisorRoute>} />
                <Route path="/admin-access" element={<AdminAccess />} />
                <Route path="/agri-consulting" element={<AgriConsulting />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/partners" element={<Partnerships />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/dashboard/learning" element={<LearningDashboard />} />
                <Route path="/elearning/:id/learn" element={<CourseLearn />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/my-cashback" element={<MyCashback />} />
                <Route path="/investors" element={<div>Investors - Coming Soon</div>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
