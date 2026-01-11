import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminRoute from "@/components/auth/AdminRoute";
import SupervisorRoute from "@/components/auth/SupervisorRoute";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Index = lazy(() => import("./pages/Index"));
const ELearning = lazy(() => import("./pages/ELearning"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Seeds = lazy(() => import("./pages/Seeds"));
const SeedDetail = lazy(() => import("./pages/SeedDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Demo = lazy(() => import("./pages/Demo"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Legal = lazy(() => import("./pages/Legal"));
const Careers = lazy(() => import("./pages/Careers"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthConfirm = lazy(() => import("./pages/AuthConfirm"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminElearningEnrollments = lazy(() => import("./pages/AdminElearningEnrollments"));
const AdminLiveStreams = lazy(() => import("./pages/AdminLiveStreams"));
const AdminElearningStats = lazy(() => import("./pages/AdminElearningStats"));
const Supervisor = lazy(() => import("./pages/Supervisor"));
const AgriConsulting = lazy(() => import("./pages/AgriConsulting"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const Donations = lazy(() => import("./pages/Donations"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="akouma-ui-theme">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<LoadingSpinner size="large" text="Chargement..." />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/elearning" element={<ELearning />} />
                <Route path="/elearning/:id" element={<CourseDetail />} />
            <Route path="/seeds" element={<Seeds />} />
            <Route path="/seeds/:id" element={<SeedDetail />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/legal" element={<Legal />} />
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
                <Route path="/partners" element={<Partnerships />} />
                <Route path="/donations" element={<Donations />} />
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
  </ErrorBoundary>
);

export default App;
